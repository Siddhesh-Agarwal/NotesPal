import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LogInIcon, MoveLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
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
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { signInSchema } from "@/schema";

export const Route = createFileRoute("/auth/sign-in")({
  component: RouteComponent,
});

type FormSchema = z.infer<typeof signInSchema>;

function RouteComponent() {
  const form = useForm<FormSchema>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const { data: session, isPending } = authClient.useSession();
  const navigate = useNavigate();

  async function onSubmit(values: FormSchema) {
    await authClient.signIn.email(
      {
        email: values.email,
        password: values.password,
      },
      {
        onSuccess: () => {
          toast.success("Signed in successfully");
          navigate({ to: "/notes" });
        },
        onError: (ctx) => {
          toast.error("Failed to sign in", {
            description: ctx.error.message,
          });
        },
      },
    );
  }

  if (isPending) {
    return (
      <div className="bg-background h-screen grid place-items-center">
        <div className="text-center">
          <Spinner />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (session) {
    navigate({ to: "/notes" });
  }

  return (
    <div className="bg-background h-screen grid place-items-center">
      <div className="max-w-xl w-full p-4">
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
                      form.formState.isSubmitting || !form.formState.isValid
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
