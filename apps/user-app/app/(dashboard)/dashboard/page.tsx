import { getServerSession } from "next-auth";
import { redirect } from 'next/navigation'
import { authOptions } from "../../lib/auth";


export default async function() {
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect('/api/auth/signin')
        return null;

    }

        return ( <div>
        Dashboard
    </div>
        )
    
}