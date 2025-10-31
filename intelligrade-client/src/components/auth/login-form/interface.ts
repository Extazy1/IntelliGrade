import { z } from "zod";
import { loginSchema } from "./helpers";

export type LoginFormData = z.infer<typeof loginSchema>;

export interface LoginFormProps {
    onSubmit?: (data: LoginFormData) => Promise<void>;
} 