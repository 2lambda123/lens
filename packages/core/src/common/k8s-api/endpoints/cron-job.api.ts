/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import moment from "moment";
import type { NamespaceScopedMetadata, ObjectReference } from "../kube-object";
import { KubeObject } from "../kube-object";
import { formatDuration } from "@k8slens/utilities";
import type { DerivedKubeApiOptions, KubeApiDependencies } from "../kube-api";
import { KubeApi } from "../kube-api";
import type { JobTemplateSpec } from "./types/job-template-spec";

export class CronJobApi extends KubeApi<CronJob> {
  constructor(deps: KubeApiDependencies, opts: DerivedKubeApiOptions) {
    super(deps, {
      ...opts,
      objectConstructor: CronJob,
    });
  }

  suspend(params: { namespace: string; name: string }) {
    return this.request.patch(this.getUrl(params), {
      data: {
        spec: {
          suspend: true,
        },
      },
    },
    {
      headers: {
        "content-type": "application/strategic-merge-patch+json",
      },
    });
  }

  resume(params: { namespace: string; name: string }) {
    return this.request.patch(this.getUrl(params), {
      data: {
        spec: {
          suspend: false,
        },
      },
    },
    {
      headers: {
        "content-type": "application/strategic-merge-patch+json",
      },
    });
  }
}

export interface CronJobSpec {
  concurrencyPolicy?: string;
  failedJobsHistoryLimit?: number;
  jobTemplate?: JobTemplateSpec;
  schedule: string;
  startingDeadlineSeconds?: number;
  successfulJobsHistoryLimit?: number;
  suspend?: boolean;
}

export interface CronJobStatus {
  lastScheduleTime?: string;
  lastSuccessfulTime?: string;
  active?: ObjectReference[];
}

export class CronJob extends KubeObject<
  NamespaceScopedMetadata,
  CronJobStatus,
  CronJobSpec
> {
  static readonly kind = "CronJob";
  static readonly namespaced = true;
  static readonly apiBase = "/apis/batch/v1/cronjobs";

  getSuspendFlag() {
    return (this.spec.suspend ?? false).toString();
  }

  getLastScheduleTime() {
    if (!this.status?.lastScheduleTime) return "-";
    const diff = moment().diff(this.status.lastScheduleTime);

    return formatDuration(diff, true);
  }

  getSchedule() {
    return this.spec.schedule;
  }

  isNeverRun() {
    const schedule = this.getSchedule();
    const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const stamps = schedule.split(" ");
    const day = Number(stamps[stamps.length - 3]);  // 1-31
    const month = Number(stamps[stamps.length - 2]);  // 1-12

    if (schedule.startsWith("@")) return false;

    return day > daysInMonth[month - 1];
  }

  isSuspend() {
    return this.spec.suspend;
  }
}
