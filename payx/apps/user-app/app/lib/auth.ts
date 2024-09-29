import client from "@payx/db/client";
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcrypt";

interface Credentials {
    number: string;
    password: string;
  }

export const authOptions = {

    providers: [
      CredentialsProvider({
          name: 'Credentials',
          credentials: {
            number: { label: "Phone number", type: "text", placeholder: "1231231231" },
            password: { label: "Password", type: "password" }
          },
          // TODO: User credentials type from next-auth
          async authorize(credentials : any) {
            // Do zod validation, OTP validation here
            console.log("Incoming credentials:", credentials);
            const existingUser = await client.user.findFirst({
                where: {
                    number: credentials.number
                }
            });

            if (existingUser) {
                const passwordValidation = await bcrypt.compare(credentials.password, existingUser.password);
                if (passwordValidation) {
                    return {
                        id: existingUser.id.toString(),
                        name: existingUser.name,
                        number: existingUser.number
                    }
                }
                console.error("Invalid password for user:", credentials.number);
                return null;
            }

            try {
                const hashedPassword = await bcrypt.hash(credentials.password, 10);
                const user = await client.user.create({
                    data: {
                        number: credentials.number,
                        password: hashedPassword
                    }
                });
            
                return {
                    id: user.id.toString(),
                    name: user.name,
                    number: user.number
                }
            } catch(e) {
                console.error(e);
            }

            return null
          },
        }),
    
       /* GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || ""
        })

        */
    ],
    secret: process.env.JWT_SECRET || "secret",
    callbacks: {
        // TODO: fix the type here

        async session({ token, session }: any) {
            session.user.id = token.sub

            return session
        }
    }
  }
 