import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/lib/language-context";

export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    const { login } = useAuth();
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const { t } = useTranslation();

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();



        try {
            if (isLogin) {
                const res = await apiRequest("POST", "/api/auth/login", { username, password });
                const data = await res.json();
                login(data.access_token, data.user);
                toast({ title: t("welcomeBack"), description: t("successLogin") });
                setLocation("/");
            } else {
                await apiRequest("POST", "/api/auth/register", {
                    name,
                    username: name,
                    password
                });
                toast({ title: t("accountCreated"), description: t("signInNewCreds") });
                setIsLogin(true);
            }
        } catch (err: any) {
            toast({
                title: isLogin ? t("loginFailed") : t("regFailed"),
                description: err.message || t("errorOccurred"),
                variant: "destructive"
            });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <Card className="w-full max-w-md border-none shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
                <CardHeader className="text-center pt-8">
                    <CardTitle className="text-3xl font-heading font-bold text-primary">TrueCost AI</CardTitle>
                    <p className="text-muted-foreground">
                        {isLogin ? t("signInAccount") : t("createAccount")}
                    </p>
                </CardHeader>
                <CardContent className="pb-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={isLogin ? "login" : "register"}
                                initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-4"
                            >
                                {!isLogin && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("fullName")}</label>
                                            <Input
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Arjun Kumar"
                                                className="rounded-xl h-12 bg-muted/30 border-none focus-visible:ring-1"
                                                required
                                            />
                                        </div>

                                    </>
                                )}
                                {isLogin && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("username")}</label>
                                        <Input
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="demo_user"
                                            className="rounded-xl h-12 bg-muted/30 border-none focus-visible:ring-1"
                                            required
                                        />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("password")}</label>
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="rounded-xl h-12 bg-muted/30 border-none focus-visible:ring-1"
                                        required
                                    />
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        <Button type="submit" className="w-full h-12 rounded-xl text-lg font-semibold mt-6 shadow-lg shadow-primary/20">
                            {isLogin ? t("signIn") : t("createAccount")}
                        </Button>

                        <div className="text-center mt-6">
                            <button
                                type="button"
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-sm text-primary font-medium hover:underline underline-offset-4"
                            >
                                {isLogin ? t("dontHaveAccount") : t("alreadyHaveAccount")}
                            </button>
                        </div>

                        {isLogin && (
                            <p className="text-center text-[10px] text-muted-foreground mt-4 uppercase tracking-widest">
                                {t("demoCreds")}
                            </p>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
