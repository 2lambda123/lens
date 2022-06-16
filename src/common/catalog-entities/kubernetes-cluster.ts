/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import type { CatalogEntityActionContext, CatalogEntityContextMenuContext, CatalogEntityMetadata, CatalogEntityStatus, CatalogCategorySpec } from "../catalog";
import { CatalogEntity, CatalogCategory, categoryVersion } from "../catalog/catalog-entity";
import { ClusterStore } from "../cluster-store/cluster-store";
import { broadcastMessage } from "../ipc";
import { app } from "electron";
import type { CatalogEntityConstructor, CatalogEntitySpec } from "../catalog/catalog-entity";
import { IpcRendererNavigationEvents } from "../../renderer/navigation/events";
import { requestClusterDisconnection } from "../../renderer/ipc";
import KubeClusterCategoryIcon from "./icons/kubernetes.svg";
import { asLegacyGlobalFunctionForExtensionApi } from "../../extensions/as-legacy-globals-for-extension-api/as-legacy-global-function-for-extension-api";
import requestClusterActivationInjectable from "../../renderer/cluster/request-activation.injectable";

export interface KubernetesClusterPrometheusMetrics {
  address?: {
    namespace: string;
    service: string;
    port: number;
    prefix: string;
  };
  type?: string;
}

export interface KubernetesClusterSpec extends CatalogEntitySpec {
  kubeconfigPath: string;
  kubeconfigContext: string;
  metrics?: {
    source: string;
    prometheus?: KubernetesClusterPrometheusMetrics;
  };
  icon?: {
    // TODO: move to CatalogEntitySpec once any-entity icons are supported
    src?: string;
    material?: string;
    background?: string;
  };
  accessibleNamespaces?: string[];
}

export enum LensKubernetesClusterStatus {
  DELETING = "deleting",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  DISCONNECTED = "disconnected",
}

export interface KubernetesClusterMetadata extends CatalogEntityMetadata {
  distro?: string;
  kubeVersion?: string;
}

/**
 * @deprecated This is no longer used as it is incorrect. Other sources can add more values
 */
export type KubernetesClusterStatusPhase = "connected" | "connecting" | "disconnected" | "deleting";

export interface KubernetesClusterStatus extends CatalogEntityStatus {
}

export function isKubernetesCluster(item: unknown): item is KubernetesCluster {
  return item instanceof KubernetesCluster;
}

const requestClusterActivation = asLegacyGlobalFunctionForExtensionApi(requestClusterActivationInjectable);

export class KubernetesCluster<
  Metadata extends KubernetesClusterMetadata = KubernetesClusterMetadata,
  Status extends KubernetesClusterStatus = KubernetesClusterStatus,
  Spec extends KubernetesClusterSpec = KubernetesClusterSpec,
> extends CatalogEntity<Metadata, Status, Spec> {
  public static readonly apiVersion: string = "entity.k8slens.dev/v1alpha1";
  public static readonly kind: string = "KubernetesCluster";

  public readonly apiVersion = KubernetesCluster.apiVersion;
  public readonly kind = KubernetesCluster.kind;

  async connect(): Promise<void> {
    if (app) {
      await ClusterStore.getInstance().getById(this.getId())?.activate();
    } else {
      await requestClusterActivation({
        clusterId: this.getId(),
        force: false,
      });
    }
  }

  async disconnect(): Promise<void> {
    if (app) {
      ClusterStore.getInstance().getById(this.getId())?.disconnect();
    } else {
      await requestClusterDisconnection(this.getId(), false);
    }
  }

  async onRun(context: CatalogEntityActionContext) {
    context.navigate(`/cluster/${this.getId()}`);
  }

  onDetailsOpen(): void {
    //
  }

  onSettingsOpen(): void {
    //
  }

  onContextMenuOpen(context: CatalogEntityContextMenuContext) {
    if (!this.metadata.source || this.metadata.source === "local") {
      context.menuItems.push({
        title: "Settings",
        icon: "settings",
        onClick: () => broadcastMessage(
          IpcRendererNavigationEvents.NAVIGATE_IN_APP,
          `/entity/${this.getId()}/settings`,
        ),
      });
    }

    switch (this.status.phase) {
      case LensKubernetesClusterStatus.CONNECTED:
      case LensKubernetesClusterStatus.CONNECTING:
        context.menuItems.push({
          title: "Disconnect",
          icon: "link_off",
          onClick: () => requestClusterDisconnection(this.getId()),
        });
        break;
      case LensKubernetesClusterStatus.DISCONNECTED:
        context.menuItems.push({
          title: "Connect",
          icon: "link",
          onClick: () => context.navigate(`/cluster/${this.getId()}`),
        });
        break;
    }
  }
}

export class KubernetesClusterCategory extends CatalogCategory {
  public readonly apiVersion = "catalog.k8slens.dev/v1alpha1";
  public readonly kind = "CatalogCategory";
  public metadata = {
    name: "Clusters",
    icon: KubeClusterCategoryIcon,
  };
  public spec: CatalogCategorySpec = {
    group: "entity.k8slens.dev",
    versions: [
      categoryVersion("v1alpha1", KubernetesCluster as CatalogEntityConstructor<KubernetesCluster>),
    ],
    names: {
      kind: "KubernetesCluster",
    },
  };
}
