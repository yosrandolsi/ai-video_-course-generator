import Image from "next/image";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
 

export default function Home() {
  return (
    <div >
      <h2>helloo</h2>
     <Button>
      hiii!!!
     </Button>
     <UserButton />
    </div>
  );
}
