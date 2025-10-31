import Pipeline from "@/components/pipeline/Pipeline/Pipeline";

export default async function PipelinePage({ params }: { params: Promise<{ documentId: string }> }) {
    const { documentId } = await params;
    return (
        <div>
            <Pipeline documentId={documentId} />
        </div>
    )
}