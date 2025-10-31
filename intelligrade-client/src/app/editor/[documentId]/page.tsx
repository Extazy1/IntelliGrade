import Editor from "@/components/editor/Editor";

export default async function EditorPage({ params }: { params: Promise<{ documentId: string }> }) {
    const { documentId } = await params;
    return (
        <Editor documentId={documentId} />
    )
}    