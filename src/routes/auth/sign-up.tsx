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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
    await db.insert(userTable).values({
      id: userId,
      email: data.email,
      name: `${data.firstName} ${data.lastName}`,
      customerId: customerId,
      salt: generateSalt(),
    });
  });

function RouteComponent() {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
  });
  const { isLoaded, signUp } = useSignUp();

  async function onSubmit(data: FormSchema) {
    if (data.password !== data.confirmPassword) {
      form.setError("confirmPassword", {
        type: "manual",
        message: "Passwords do not match",
      });
      return;
    }
    if (!isLoaded) {
      return;
    }
    await signUp
      .create({
        firstName: data.firstName,
        lastName: data.lastName,
        emailAddress: data.email,
        password: data.password,
        legalAccepted: data.termsAccepted,
        redirectUrl: "/notes",
      })
      .then(async (result) => {
        const userId = result.id;
        if (!userId) {
          toast.error("User sign up failed");
          return;
        }
        await createUserInfo({ data: { userId, data } });
        if (result.status === "complete") {
          toast.success("User signed up successfully");
        } else {
          toast.error("User sign up failed");
        }
      });
  }

  return (
    <div className="bg-background h-screen grid place-items-center">
      <div className="max-w-xl w-full">
        <Link to="/" className="flex gap-2 mb-2 hover:underline">
          <MoveLeft />
          Back
        </Link>
        <Card className="w-full">
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
                <div className="flex space-x-4">
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
                      <FormLabel>Terms Accepted</FormLabel>
                    </FormItem>
                  )}
                />
                <div className="flex flex-col w-full space-y-2">
                  <Button type="submit" disabled={!isLoaded} className="w-full">
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
