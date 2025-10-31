import { ReactNode } from "react";

/**
 * 特性项目接口
 */
export interface FeatureItem {
    title: string;
    description: string;
    icon?: string | ReactNode;
    imageUrl?: string;
}

/**
 * 用户评价项目接口
 */
export interface TestimonialItem {
    content: string;
    author: string;
    role: string;
    avatar?: string;
}


/**
 * 特性区组件Props接口
 */
export interface FeaturesSectionProps {
    featuresData: FeatureItem[];
}

/**
 * 评价区组件Props接口
 */
export interface TestimonialsSectionProps {
    testimonialsData: TestimonialItem[];
}

/**
 * 导航栏组件Props接口
 */
export interface NavbarProps {
    className?: string;
    onLoginClick?: () => void;
    onSignUpClick?: () => void;
}

/**
 * PDF响应接口
 */
export interface PDFReponse {
    data: {
        url: string;
    }
}