'use client'
import { SignUpForm } from "@/components/auth/sign-up-form";
import { SignUpFormData } from "@/components/auth/sign-up-form/interface";
import { useToast } from "@/hooks/use-toast";
import Cookies from 'js-cookie';
import { API_HOST } from "@/lib/host";
import { useRouter } from "next/navigation";
import { RegisterResponse } from "@/types/types";
import { motion } from "framer-motion";
import axios from "axios";

export default function SignUpPage() {
    const { toast } = useToast();
    const router = useRouter();

    const handleSuccess = (responseData: RegisterResponse) => {
        Cookies.set("jwt", responseData.jwt);
        toast({
            title: "Registration Successful",
            description: "Your account has been created successfully.",
            duration: 2000
        });
        router.push("/");
    }

    /**
     * Handle the sign up process
     * @param data - The sign up form data
     */
    const handleSignUp = async (data: SignUpFormData) => {
        try {
            const response = await axios.post(`${API_HOST}/auth/local/register`, {
                username: data.name,
                email: data.email,
                password: data.password
            });

            handleSuccess(response.data);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                toast({
                    variant: "destructive",
                    title: "Registration Failed",
                    description: error.response.data.error.message || "An error occurred during registration. Please try again."
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Registration Failed",
                    description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again later."
                });
            }
        }
    };

    return (
        <motion.div
            className="container m-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <SignUpForm onSubmit={handleSignUp} />
        </motion.div>
    );
} 