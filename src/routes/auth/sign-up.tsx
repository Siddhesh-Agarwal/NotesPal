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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { metadata } from "@/data";
import { authClient } from "@/lib/auth-client";
import { signupFormSchema } from "@/schema";

export const Route = createFileRoute("/auth/sign-up")({
  component: RouteComponent,
});

type SignupFormSchema = z.infer<typeof signupFormSchema>;

function RouteComponent() {
  const navigate = useNavigate();
  const signupForm = useForm<SignupFormSchema>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      termsAccepted: false,
    },
  });

  async function onSubmitSignUpForm(data: SignupFormSchema) {
    await authClient.signUp.email(
      {
        email: data.email,
        password: data.password,
        name: `${data.firstName} ${data.lastName}`,
      },
      {
        onSuccess: () => {
          toast.success("Signed up successfully");
          navigate({ to: "/auth/checkout" });
        },
        onError: (ctx) => {
          toast.error("Failed to sign up", {
            description: ctx.error.message,
          });
        },
      },
    );
  }

  return (
    <div className="bg-background h-screen grid place-items-center">
      <div className="max-w-xl w-full p-4">
        <Link to="/" className="flex gap-2 mb-2 hover:underline">
          <MoveLeft />
          Back
        </Link>
        <Card className="w-full border-border shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Sign Up</CardTitle>
            <CardDescription className="text-lg">
              Register for your {metadata.title} account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...signupForm}>
              <form
                onSubmit={signupForm.handleSubmit(onSubmitSignUpForm)}
                className="space-y-4"
              >
                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 space-x-0 md:space-x-4">
                  <FormField
                    control={signupForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Jane"
                            className="border-border"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signupForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Doe"
                            className="border-border"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={signupForm.control}
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
                          autoComplete="email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signupForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          className="border-border"
                          autoComplete="new-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signupForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          className="border-border"
                          autoComplete="new-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signupForm.control}
                  name="termsAccepted"
                  render={({ field }) => (
                    <FormItem className="flex">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="border-border"
                        />
                      </FormControl>
                      <FormLabel>
                        Accept the
                        <Link
                          to="/terms-and-conditions"
                          target="_blank"
                          className="font-semibold hover:underline"
                        >
                          Terms and Conditions
                        </Link>
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <div className="flex flex-col w-full space-y-2">
                  <Button
                    type="submit"
                    disabled={
                      signupForm.formState.isSubmitting ||
                      !signupForm.formState.isValid
                    }
                    className="w-full"
                  >
                    <LogInIcon />
                    Sign Up
                  </Button>
                  <p className="text-muted-foreground text-center">
                    Already have an account?{" "}
                    <Link
                      to="/auth/sign-in"
                      className="font-semibold hover:underline"
                    >
                      Sign In
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
