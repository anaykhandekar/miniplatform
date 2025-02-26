import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/record/practice');
  
  return null;
}