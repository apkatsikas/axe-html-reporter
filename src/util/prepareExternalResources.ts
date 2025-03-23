import { ExternalResource } from "..";

export function prepareExternalResources(
    externalResources: ExternalResource[], 
    serveExternalResources: boolean | undefined
  ): ExternalResource[] {
    if (!serveExternalResources) {
        return externalResources;
    }
    return serveResource(externalResources);
}

function serveResource(externalResources: ExternalResource[]): ExternalResource[] {
    return externalResources.map(resource => {
        const link = resource.link.substring(resource.link.lastIndexOf("/") + 1);
        return {
            link: link
        };
    });
}
