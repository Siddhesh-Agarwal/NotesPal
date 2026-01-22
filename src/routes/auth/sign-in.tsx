import { useSignIn, useSignUp, useUser } from "@clerk/tanstack-react-start";
import type { EmailCodeFactor } from "@clerk/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LogInIcon, MoveLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod/v4";
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
  const { signIn, isLoaded, setActive } = useSignIn();
  const { isSignedIn, isLoaded: isUserLoaded } = useUser();
  const { signUp } = useSignUp();
  const navigate = useNavigate();

  async function onSubmit(values: FormSchema) {
    if (!isLoaded) {
      toast.error("Please wait for the app to load");
      return;
    }
    try {
      const result = await signIn.create({
        strategy: "password",
        password: values.password,
        identifier: values.email,
      });
      if (result.status === "complete") {
        await setActive({
          session: result.createdSessionId,
          navigate: async ({ session }) => {
            if (session.currentTask) {
              return;
            }
            navigate({ to: "/notes" });
          },
        });
      } else if (result.status === "needs_second_factor") {
        const emailCodeFactor = result.supportedSecondFactors?.find(
          (factor): factor is EmailCodeFactor =>
            factor.strategy === "email_code",
        );
        if (emailCodeFactor) {
          await signIn.prepareSecondFactor({
            strategy: "email_link",
            redirectUrl: "/notes",
            emailAddressId: values.email,
          });
        }
      }
    } catch (err: any) {
      if (err.errors[0].code === "form_identifier_not_found") {
        // Start the sign-up process using the email and password provided
        try {
          await signUp?.create({
            emailAddress: values.email,
            password: values.password,
          });

          // Send the user an email with the verification code
          await signUp?.prepareEmailAddressVerification({
            strategy: "email_link",
            redirectUrl: "/notes",
          });
        } catch {
          toast.error("An error occurred while signing in");
        }
      }
    }
  }

  if (!isUserLoaded) {
    return (
      <div className="bg-background h-screen grid place-items-center">
        <div className="text-center">
          <Spinner />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (isSignedIn) {
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

                {/** biome-ignore lint/correctness/useUniqueElementIds: <https://clerk.com/docs/guides/development/custom-flows/authentication/bot-sign-up-protection> */}
                <div id="clerk-captcha" data-cl-size="flexible" />
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
