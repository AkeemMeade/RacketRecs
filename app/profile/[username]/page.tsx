import PublicProfilePage from "@/components/publicProfile";


export default function Page({ params }: { params: { username: string } }) {
  return <PublicProfilePage params={Promise.resolve(params)} />;
  
}
