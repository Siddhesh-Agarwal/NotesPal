import { useUser } from "@clerk/clerk-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link } from "@tanstack/react-router";
import { KeyRound, MoveLeft, Trash2, UserPen } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
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
import { getAvatarUrl } from "@/lib/avatar";

export const Route = createFileRoute("/profile")({
  component: RouteComponent,
});

const profileFormSchema = z.object({
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  email: z.email(),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(1),
  confirmNewPassword: z.string().min(1),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;
type PasswordFormData = z.infer<typeof passwordFormSchema>;

function RouteComponent() {
  const { user, isLoaded } = useUser();
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.primaryEmailAddress?.emailAddress || "",
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

  if (!isLoaded) {
    return (
      <div className="bg-background flex justify-center items-center h-screen">
        <div className="flex flex-col gap-2 text-foreground items-center">
          <Spinner />
          <span className="text-xl">Loading...</span>
        </div>
      </div>
    );
  }

  if (user === null) {
    return <NotFoundPage backTo="/" />;
  }

  async function handleUpdateUser(data: ProfileFormData) {
    if (!user) {
      toast.error("User not found");
      return;
    }
    await user
      .update({
        firstName: data.firstName,
        lastName: data.lastName,
      })
      .then(() => {
        toast.success("User updated");
      })
      .catch((error) => {
        toast.error("Failed to update user", {
          description: error.message,
        });
      });
  }

  async function handleUpdatePassword(values: PasswordFormData) {
    if (!user) {
      toast.error("User not found");
      return;
    }
    if (values.confirmNewPassword !== values.newPassword) {
      passwordForm.setError("confirmNewPassword", {
        type: "custom",
        message: "Passwords do not match",
      });
      return;
    }
    await user
      .updatePassword({
        newPassword: values.newPassword,
        currentPassword: values.currentPassword,
      })
      .then(() => {
        toast.success("Password updated successfully!");
      })
      .catch(() => {
        toast.error("Password update failed.");
      });
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
                <Avatar className="outline size-24 mx-auto ">
                  <AvatarImage
                    src={getAvatarUrl({
                      email: user?.primaryEmailAddress?.emailAddress,
                    })}
                  />
                  <AvatarFallback>
                    {`${user?.firstName?.charAt(0) ?? ""}${user?.lastName?.charAt(0) ?? ""}`.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-sans text-lg mb-2">{user.fullName}</span>
                  <span className="font-mono">{user.id}</span>
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
                            <Button type="submit" disabled={!user}>
                              Save
                            </Button>
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
                      <Button variant="destructive" className="flex gap-2">
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
