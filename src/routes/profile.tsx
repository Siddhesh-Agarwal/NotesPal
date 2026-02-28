import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link } from "@tanstack/react-router";
import { KeyRound, MoveLeft, Trash2, UserPen } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type z from "zod";
import NotFoundPage from "@/components/page/not-found";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { getAvatarUrl } from "@/lib/avatar";
import { passwordFormSchema, profileFormSchema } from "@/schema";

export const Route = createFileRoute("/profile")({
  component: RouteComponent,
});

type ProfileFormData = z.infer<typeof profileFormSchema>;
type PasswordFormData = z.infer<typeof passwordFormSchema>;

function RouteComponent() {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;
  const emailAddress = user?.email;
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user?.name?.split(" ")[0] ?? "",
      lastName: user?.name?.split(" ")[1] ?? "",
      email: emailAddress ?? "",
    },
  });
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  if (isPending) {
    return (
      <div className="bg-background flex justify-center items-center h-screen">
        <div className="flex flex-col gap-2 text-foreground items-center">
          <Spinner />
          <span className="text-xl">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <NotFoundPage backTo="/" />;
  }

  async function handleUpdateUser(data: ProfileFormData) {
    await authClient.updateUser(
      {
        name: `${data.firstName} ${data.lastName}`,
      },
      {
        onSuccess: () => {
          toast.success("User updated");
        },
        onError: (ctx) => {
          toast.error("Failed to update user", {
            description: ctx.error.message,
          });
        },
      },
    );
  }

  async function handleUpdatePassword(values: PasswordFormData) {
    await authClient.changePassword(
      {
        newPassword: values.newPassword,
        currentPassword: values.currentPassword,
        revokeOtherSessions: true,
      },
      {
        onSuccess: () => {
          toast.success("Password updated successfully!");
        },
        onError: (ctx) => {
          toast.error("Password update failed.", {
            description: ctx.error.message,
          });
        },
      },
    );
  }

  async function handleAccountDelete() {
    toast.info("Account deletion not implemented in Better Auth client yet.");
  }

  return (
    <div className="min-h-screen bg-background grid place-items-center p-4">
      <div className="max-w-xl w-full">
        <Link to="/notes" className="flex gap-2 mb-2 hover:underline">
          <MoveLeft />
          Back
        </Link>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              <p>Manage your account settings</p>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <section className="flex flex-col gap-4">
              <div className="flex">
                <Avatar className="outline size-24 mx-auto">
                  <AvatarImage
                    src={getAvatarUrl({
                      email: emailAddress,
                    })}
                  />
                  <AvatarFallback>
                    {user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2">
                  <span className="font-sans text-xl">{user.name}</span>
                  <span className="font-sans text-sm">{emailAddress}</span>
                  <span className="font-mono text-sm">{user.id}</span>
                </div>
              </div>
              <Form {...profileForm}>
                <form
                  className="space-y-4"
                  onSubmit={profileForm.handleSubmit(handleUpdateUser)}
                >
                  <div className="flex w-full gap-4">
                    <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="border border-border"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="border border-border"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={profileForm.control}
                    name="email"
                    disabled
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} className="border border-border" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      className="flex gap-2 w-full"
                      type="submit"
                    >
                      <UserPen />
                      Update Profile
                    </Button>
                  </div>
                </form>
              </Form>

              <Separator className="my-4" />

              <div className="flex flex-row w-full gap-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="default" className="flex flex-1 gap-2">
                      <KeyRound />
                      Change Password
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                      <DialogDescription>
                        Enter your current password and new password to change
                        your password.
                      </DialogDescription>
                      <Form {...passwordForm}>
                        <form
                          className="flex flex-col gap-4"
                          onSubmit={passwordForm.handleSubmit(
                            handleUpdatePassword,
                          )}
                        >
                          <FormField
                            control={passwordForm.control}
                            name="currentPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Current Password</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    className="border border-border"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={passwordForm.control}
                            name="newPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>New Password</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    className="border border-border"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={passwordForm.control}
                            name="confirmNewPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirm New Password</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    className="border border-border"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <DialogFooter>
                            <Button type="submit">Save</Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="flex flex-1 gap-2">
                      <Trash2 />
                      Delete Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Account</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete your account? This
                        action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="destructive"
                        className="flex gap-2"
                        onClick={handleAccountDelete}
                      >
                        <Trash2 />
                        Delete
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
