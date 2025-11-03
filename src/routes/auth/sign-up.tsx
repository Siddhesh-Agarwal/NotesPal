import { useSignUp } from "@clerk/clerk-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { LogInIcon, MoveLeft } from "lucide-react";
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
import { metadata } from "@/data/meta";
import { db } from "@/db";
import { userTable } from "@/db/schema";
import { polar } from "@/integrations/polar";
import { generateSalt } from "@/lib/encrypt";

export const Route = createFileRoute("/auth/sign-up")({
  component: RouteComponent,
});

const formSchema = z.object({
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  email: z.email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
  termsAccepted: z.boolean().refine((value) => value, {
    message: "You must accept the terms and conditions",
  }),
});

type FormSchema = z.infer<typeof formSchema>;

const createUserInfo = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      userId: z.string().min(1),
      data: formSchema,
    }),
  )
  .handler(async (request) => {
    const { data, userId } = request.data;
    console.log(request);
    const { id: customerId } = await polar.customers.create({
      externalId: userId,
      email: data.email,
      name: `${data.firstName} ${data.lastName}`,
    });
    const [user] = await db
      .insert(userTable)
      .values({
        id: userId,
        email: data.email,
        name: `${data.firstName} ${data.lastName}`,
        customerId: customerId,
        salt: generateSalt(),
      })
      .returning();
    return user;
  });

function RouteComponent() {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
  });
  const { isLoaded, signUp, setActive } = useSignUp();

  async function onSubmit(data: FormSchema) {
    if (data.password !== data.confirmPassword) {
      form.setError("confirmPassword", {
        type: "manual",
        message: "Passwords do not match",
      });
      return;
    }

    if (!isLoaded) return;

    console.log("User data:", data);

    try {
      const result = await signUp.create({
        firstName: data.firstName,
        lastName: data.lastName,
        emailAddress: data.email,
        password: data.password,
        legalAccepted: data.termsAccepted,
        redirectUrl: "/notes",
      });

      console.log("Sign-up result:", result);

      if (result.status === "complete" && result.id) {
        // Actually log them in
        await setActive({ session: result.createdSessionId });

        // Now create your user record
        const user = await createUserInfo({
          data: { userId: result.id, data },
        });

        // Wait for checkout to complete before redirecting
        const params = new URLSearchParams();
        params.append("products", "80b1520f-73f6-4f47-8110-cd16041497d9");
        params.append("customerId", user.customerId);
        params.append("customerExternalId", user.id);
        params.append("customerName", user.name);
        params.append("customerEmail", user.email);
        const response = await fetch(`/api/portal?${params.toString()}`);
        console.log("Response", response);
        const { url } = await response.json();
        if (url) {
          window.location.href = url;
        } else {
          // Redirect to dashboard if no checkout needed
          window.location.href = "/notes";
        }
      } else {
        result.prepareEmailAddressVerification({
          strategy: "email_link",
          redirectUrl: `${metadata.site}/notes`,
        });
      }
    } catch (err) {
      const name =
        err instanceof Error ? err.name : "An unknown error occurred";
      const message =
        err instanceof Error ? err.message : "Please try again later";
      toast.error(name, { description: message });
      console.error(err);
    }
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
              Register for your notespal account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 space-x-0 md:space-x-4">
                  <FormField
                    control={form.control}
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
                    control={form.control}
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
                      <FormMessage />
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          className="border-border"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
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
                      !isLoaded ||
                      !form.formState.isValid ||
                      form.formState.isSubmitting
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
