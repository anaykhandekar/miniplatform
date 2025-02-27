import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

console.log({
  AWS_REGION: process.env.AWS_REGION,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
});

const supabaseUrl = 'https://cywcqgoswzxsdefdclcs.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)


const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const scriptId = formData.get('scriptId') as string;
    const scriptText = formData.get('scriptText');
    const transcription = formData.get('transcription');

    const { data: newRecord, error: insertError } = await supabase
      .from('recordings')
      .insert({
        submission_date: new Date().toISOString(),
        script_text: scriptText,
        transcription: transcription
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating Supabase record:', insertError);
      return NextResponse.json({ error: 'Failed to create database record' }, { status: 500 });
    }

    const recordId = newRecord.id

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }
    
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${recordId}.mpeg`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: fileName,
      Body: buffer,
      ContentType: 'audio/mpeg',
    });

    await s3Client.send(command);

    const getCommand = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: fileName,
    });
    
    const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });

    const { error: updateError } = await supabase
      .from('recordings')
      .update({ 
        s3_filepath: fileName 
      })
      .eq('id', recordId);
    
    if (updateError) {
      console.error('Error updating Supabase record:', updateError);
      // Continue anyway since the file was uploaded
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error uploading to S3:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }

  
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    if (key) {
      const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: key,
      });
      
      const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      
      return NextResponse.json({ url });
    }
    
    const { data, error } = await supabase
      .from('recordings')
      .select('*')
      .order('submission_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching recordings:', error);
      return NextResponse.json({ error: 'Failed to fetch recordings' }, { status: 500 });
    }
    
    // For each recording, generate a signed URL
    const recordingsWithUrls = await Promise.all(
      data.map(async (recording) => {
        if (recording.s3_filepath) {
          const command = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME!,
            Key: recording.s3_filepath,
          });
          
          const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
          
          return {
            ...recording,
            audio_url: url
          };
        }
        
        return recording;
      })
    );
    
    return NextResponse.json({ recordings: recordingsWithUrls });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

