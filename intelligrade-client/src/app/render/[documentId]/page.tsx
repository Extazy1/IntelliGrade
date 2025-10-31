import { RenderContainer } from "@/components/render/RenderContainer";

async function RenderPage({ params }: { params: Promise<{ documentId: string }> }) {
    const { documentId } = await params;

    return (
        <RenderContainer documentId={documentId} />
    )
}

export default RenderPage;