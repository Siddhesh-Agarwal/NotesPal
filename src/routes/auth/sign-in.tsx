import { useSignIn } from "@clerk/clerk-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { db } from "@/db";
import { userTable } from "@/db/schema";

export const Route = createFileRoute("/auth/sign-in")({
  component: RouteComponent,
});

const formSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

type FormSchema = z.infer<typeof formSchema>;

const checkExists = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      email: z.email(),
    }),
  )
  .handler(async (request) => {
    const { email } = request.data;
    const [user] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, email));
    return user !== null;
  });

function RouteComponent() {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const { signIn, isLoaded } = useSignIn();

  async function onSubmit(values: FormSchema) {
    if (!isLoaded) {
      toast.error("Please wait for the app to load");
      return;
    }
    await signIn
      .create({
        strategy: "password",
        password: values.password,
        identifier: values.email,
      })
      .then(async () => {
        const doesUserExist = await checkExists({
          data: { email: values.email },
        });
        if (!doesUserExist) {
          toast.error("User does not exist");
          return;
        }
        toast.success("Logged in successfully");
      });
  }

  return (
    <div className="bg-background grid place-items-center">
      <Card>
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Enter your email and password to sign in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="janedoe@example.com"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex flex-col w-full">
                <Button type="submit" disabled={!isLoaded}>
                  Sign In
                </Button>
                <p className="mt-4 text-muted-foreground">
                  Don't have an account? <Link to="/auth/sign-up">Sign Up</Link>
                </p>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
