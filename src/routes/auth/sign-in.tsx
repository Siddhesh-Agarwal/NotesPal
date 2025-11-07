import { useSignIn, useUser } from "@clerk/clerk-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { LogInIcon, MoveLeft } from "lucide-react";
import { useEffect, useEffectEvent } from "react";
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
import { useStore } from "@/store";

export const Route = createFileRoute("/auth/sign-in")({
  component: RouteComponent,
});

const formSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

type FormSchema = z.infer<typeof formSchema>;

const getUser = createServerFn({ method: "GET" })
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
    return user;
  });

function RouteComponent() {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const { signIn, isLoaded, setActive } = useSignIn();
  const { user, isSignedIn, isLoaded: isUserLoaded } = useUser();
  const store = useStore();
  const navigate = useNavigate();

  const setUser = useEffectEvent(async (email: string) => {
    const user = await getUser({ data: { email } });
    store.setUser({
      userId: user.id,
      customerId: user.customerId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });
  });

  async function onSubmit(values: FormSchema) {
    if (!isLoaded) {
      toast.error("Please wait for the app to load");
      return;
    }
    const result = await signIn.create({
      strategy: "password",
      password: values.password,
      identifier: values.email,
    });
    if (result.status === "complete") {
      await setUser(values.email);
      await setActive({
        redirectUrl: "/notes",
        session: result.createdSessionId,
      });
    }
  }

  useEffect(() => {
    if (isUserLoaded && isSignedIn && user.primaryEmailAddress) {
      setUser(user.primaryEmailAddress.emailAddress).then(() => {
        navigate({ to: "/notes" });
      });
    }
  }, [isUserLoaded, isSignedIn, navigate, setUser, user?.primaryEmailAddress]);

  return (
    <div className="bg-background h-screen grid place-items-center">
      <div className="max-w-xl w-full">
        <Link to="/" className="flex gap-2 mb-2 hover:underline">
          <MoveLeft />
          Back
        </Link>
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Sign In</CardTitle>
            <CardDescription className="text-lg">
              Enter your email and password to sign in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
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
                          className="border-border"
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
                        <Input
                          {...field}
                          type="password"
                          className="border-border"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex flex-col w-full space-y-2">
                  <Button
                    type="submit"
                    disabled={
                      !isLoaded ||
                      form.formState.isSubmitting ||
                      !form.formState.isValid
                    }
                  >
                    <LogInIcon />
                    Sign In
                  </Button>
                  <p className="text-muted-foreground text-center">
                    Don't have an account?{" "}
                    <Link
                      to="/auth/sign-up"
                      className="font-semibold hover:underline"
                    >
                      Sign Up
                    </Link>
                  </p>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
