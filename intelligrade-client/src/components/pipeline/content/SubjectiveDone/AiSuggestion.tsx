import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SubjectiveLLMResponse, SubjectiveQuestion } from "@/types/types";
import { Bot, Sparkles, Type } from "lucide-react";

export interface AiSuggestionProps {
    aiSuggestion: SubjectiveLLMResponse | null;
    isAiLoading: boolean;
    questionDef: SubjectiveQuestion;
}

export default function AiSuggestion({
    aiSuggestion,
    isAiLoading,
    questionDef
}: AiSuggestionProps) {
    return (
        <div className="w-full h-[calc(100vh-100px)] pl-4">
            <Card className="h-full overflow-y-scroll shadow-sm">
                <CardHeader className="pb-2 pt-4 px-5">
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                        <Bot className="w-5 h-5 text-primary" />
                        AI Suggestions
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isAiLoading ? (
                        <div className="h-[calc(100vh-280px)] flex flex-col items-center justify-center space-y-4 px-4 w-96">
                            <div className="relative w-16 h-16">
                                <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                                <Bot className="absolute inset-0 m-auto w-8 h-8 text-primary" />
                            </div>
                            <p className="text-sm text-muted-foreground">AI is analyzing the answer...</p>
                        </div>
                    ) : (
                        <ScrollArea className="">
                            {aiSuggestion ? (
                                <div className="px-5 py-2 space-y-4">
                                    <div className="space-y-3 text-sm leading-relaxed">
                                        {aiSuggestion.suggestion.split('\n').map((paragraph, index) => (
                                            <p key={index} className="text-muted-foreground">{paragraph}</p>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="font-medium">Suggested Score:</div>
                                        <div className="underline">
                                            {aiSuggestion.score}/{questionDef.score}
                                        </div>
                                    </div>

                                    <div className="bg-muted/40 rounded-lg p-4 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-primary" />
                                            <h4 className="text-sm font-medium">Reasoning</h4>
                                        </div>
                                        <div className="text-sm text-muted-foreground leading-relaxed">
                                            {aiSuggestion.reasoning}
                                        </div>
                                    </div>

                                    <div className="rounded-lg border p-4 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Type className="w-4 h-4 text-primary" />
                                            <h4 className="text-sm font-medium">OCR Result</h4>
                                        </div>
                                        <div className="font-mono text-sm bg-muted/50 p-2 rounded">
                                            {aiSuggestion.ocrResult}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-64">
                                    <div className="text-center space-y-2">
                                        <Bot className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                                        <p className="text-sm text-muted-foreground">
                                            Select a question to see AI suggestions
                                        </p>
                                    </div>
                                </div>
                            )}
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 