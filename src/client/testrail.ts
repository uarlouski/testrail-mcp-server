import { Case, Section, Priority, CaseType, CaseField, Template, Project, Run, Status, Test, Result, Attachment, Label } from "../types/testrail.js";

import * as fs from "fs";

interface PaginatedCasesResponse {
    cases: Case[];
    _links: { next: string | null };
}

interface PaginatedTestsResponse {
    tests: Test[];
    _links: { next: string | null };
}

interface PaginatedSectionsResponse {
    sections: Section[];
    _links?: { next: string | null };
}

const API_INDEX = '/index.php?';
const API_BASE_V2 = `${API_INDEX}/api/v2`;

export class TestRailClient {
    private baseUrl: string;
    private headers: HeadersInit;
    private auth: string;
    private prioritiesPromise: Promise<Priority[]> | null = null;
    private caseTypesPromise: Promise<CaseType[]> | null = null;
    private caseFieldsPromise: Promise<CaseField[]> | null = null;
    private statusesPromise: Promise<Status[]> | null = null;
    private projectsPromise: Promise<Project[]> | null = null;
    private templatesPromiseMap: Map<string, Promise<Template[]>> = new Map();

    constructor(baseUrl: string, email: string, apiKey: string) {
        this.baseUrl = baseUrl.replace(/\/$/, "");
        const auth = Buffer.from(`${email}:${apiKey}`).toString('base64');
        this.auth = `Basic ${auth}`;
        this.headers = {
            "Content-Type": "application/json",
            "Authorization": this.auth,
        };
    }

    async getCase(caseId: number): Promise<Case> {
        return this.get<Case>(`${API_BASE_V2}/get_case/${caseId}`);
    }

    async getCasesRecursively(projectId: number, sectionId: number, filter?: Record<string, string>, excludedSectionNames?: string[]): Promise<Case[]> {
        const sections = await this.getSections(projectId);

        const sectionIds = this.getSubSectionIds(sections, sectionId, excludedSectionNames);

        sectionIds.push(sectionId);

        const promises = sectionIds.map(id => this.getCases(projectId, id, filter));
        const results = await Promise.all(promises);

        return results.flat();
    }

    private getSubSectionIds(sections: Section[], parentId: number, excludedSectionNames?: string[]): number[] {
        const children = sections.filter(s => s.parent_id === parentId);

        const validChildren = children.filter(s => !excludedSectionNames?.includes(s.name));

        let ids = validChildren.map(s => s.id);

        for (const child of validChildren) {
            ids = ids.concat(this.getSubSectionIds(sections, child.id, excludedSectionNames));
        }

        return ids;
    }

    async getCases(projectId: number, sectionId?: number, filter?: Record<string, string>): Promise<Case[]> {
        let url = `${API_BASE_V2}/get_cases/${projectId}`;

        if (sectionId) {
            url += `&section_id=${sectionId}`;
        }

        if (filter) {
            for (const [key, value] of Object.entries(filter)) {
                url += `&${key}=${encodeURIComponent(value)}`;
            }
        }

        return this.paginateAll<Case>(url, 'cases');
    }

    async getSection(sectionId: number): Promise<Section> {
        return this.get<Section>(`${API_BASE_V2}/get_section/${sectionId}`);
    }

    async getPriorities(): Promise<Priority[]> {
        if (!this.prioritiesPromise) {
            this.prioritiesPromise = this.get<Priority[]>(`${API_BASE_V2}/get_priorities`);
        }
        return this.prioritiesPromise;
    }

    async getCaseTypes(): Promise<CaseType[]> {
        if (!this.caseTypesPromise) {
            this.caseTypesPromise = this.get<CaseType[]>(`${API_BASE_V2}/get_case_types`);
        }
        return this.caseTypesPromise;
    }

    async getCaseFields(): Promise<CaseField[]> {
        if (!this.caseFieldsPromise) {
            this.caseFieldsPromise = this.get<CaseField[]>(`${API_BASE_V2}/get_case_fields`);
        }
        return this.caseFieldsPromise;
    }

    async getStatuses(): Promise<Status[]> {
        if (!this.statusesPromise) {
            this.statusesPromise = this.get<Status[]>(`${API_BASE_V2}/get_statuses`);
        }
        return this.statusesPromise;
    }

    async getTemplates(projectId: number): Promise<Template[]> {
        if (!this.templatesPromiseMap.has(projectId.toString())) {
            this.templatesPromiseMap.set(
                projectId.toString(),
                this.get<Template[]>(`${API_BASE_V2}/get_templates/${projectId}`)
            );
        }
        return this.templatesPromiseMap.get(projectId.toString())!;
    }

    async updateCase(caseId: number, fields: Record<string, any>): Promise<Case> {
        return this.post<Case>(`${API_BASE_V2}/update_case/${caseId}`, fields);
    }

    async updateCases(suiteId: number, caseIds: number[], fields: Record<string, any>): Promise<Case[]> {
        const response = await this.post<{ updated_cases: Case[] }>(`${API_BASE_V2}/update_cases/${suiteId}`, {
            case_ids: caseIds,
            ...fields,
        });

        return response.updated_cases;
    }

    async createCase(sectionId: number, fields: Record<string, any>): Promise<Case> {
        return this.post<Case>(`${API_BASE_V2}/add_case/${sectionId}`, fields);
    }

    async addRun(projectId: number, fields: Record<string, any>): Promise<Run> {
        return this.post<Run>(`${API_BASE_V2}/add_run/${projectId}`, fields);
    }

    async getSections(projectId: number): Promise<Section[]> {
        const url = `${API_BASE_V2}/get_sections/${projectId}`;
        return this.paginateAll<Section>(url, 'sections');
    }

    async getProjects(): Promise<Project[]> {
        if (!this.projectsPromise) {
            this.projectsPromise = this.get<{ projects: Project[] }>(`${API_BASE_V2}/get_projects`)
                .then(response => response.projects);
        }
        return this.projectsPromise;
    }

    async getLabels(projectId: number): Promise<Label[]> {
        const url = `${API_BASE_V2}/get_labels/${projectId}`;
        return this.paginateAll<Label>(url, 'labels');
    }

    async getTests(runId: number, statusId?: number[]): Promise<Test[]> {
        let url = `${API_BASE_V2}/get_tests/${runId}`;

        if (statusId && statusId.length > 0) {
            url += `&status_id=${statusId.join(',')}`;
        }

        return this.paginateAll<Test>(url, 'tests');
    }


    async addResults(runId: number, results: Array<Record<string, any>>): Promise<Result[]> {
        return this.post<Result[]>(`${API_BASE_V2}/add_results/${runId}`, { results });
    }

    async addResultsForCases(runId: number, results: Array<Record<string, any>>): Promise<Result[]> {
        return this.post<Result[]>(`${API_BASE_V2}/add_results_for_cases/${runId}`, { results });
    }

    async addAttachmentToRun(runId: number, filePath: string, filename: string): Promise<Attachment> {
        const fileBuffer = await fs.promises.readFile(filePath);
        const blob = new Blob([fileBuffer]);
        const formData = new FormData();
        formData.append('attachment', blob, filename);

        const headers: HeadersInit = {
            'Authorization': this.auth,
        };

        return this._executeRequest<Attachment>('POST', `${API_BASE_V2}/add_attachment_to_run/${runId}`, headers, formData);
    }

    private async paginateAll<T>(url: string, dataKey: string): Promise<T[]> {
        const allItems: T[] = [];
        let nextUrl: string | null = url;

        while (nextUrl) {
            const response: any = await this.get<any>(nextUrl);
            if (response[dataKey] && Array.isArray(response[dataKey])) {
                allItems.push(...response[dataKey]);
            }

            nextUrl = response._links?.next || null;
            if (nextUrl) {
                nextUrl = `${API_INDEX}${nextUrl}`;
            }
        }

        return allItems;
    }

    private async get<T>(endpoint: string): Promise<T> {
        return this.executeRequest<T>('GET', endpoint);
    }

    private async post<T>(endpoint: string, data: Record<string, any>): Promise<T> {
        return this.executeRequest<T>('POST', endpoint, data);
    }

    private async executeRequest<T>(method: 'GET' | 'POST', endpoint: string, data?: Record<string, any>): Promise<T> {
        let jsonData = undefined;
        if (data) {
            jsonData = JSON.stringify(data);
        }

        return this._executeRequest<T>(method, endpoint, this.headers, jsonData);
    }

    private async _executeRequest<T>(method: 'GET' | 'POST', endpoint: string, headers: HeadersInit, body?: any): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const params: RequestInit = {
            method,
            headers,
            body,
        };

        const maxRetries = 3;
        const baseDelayMs = 1000;
        let attempt = 0;

        while (attempt <= maxRetries) {
            console.error(`[TestRailClient] Executing ${method} request to ${endpoint}${attempt > 0 ? ` (Attempt ${attempt + 1})` : ''}`);
            const startTime = Date.now();

            try {
                const response = await fetch(url, params);
                const duration = Date.now() - startTime;

                console.error(`[TestRailClient] Received ${response.status} ${response.statusText} from ${method} ${endpoint} in ${duration}ms`);

                if (!response.ok) {
                    if ([429, 500, 502, 503, 504].includes(response.status) && attempt < maxRetries) {
                        let delayMs = baseDelayMs * Math.pow(2, attempt);

                        const retryAfter = response.headers.get('Retry-After');
                        if (retryAfter) {
                            const retryAfterSeconds = parseInt(retryAfter);
                            if (!isNaN(retryAfterSeconds)) {
                                delayMs = retryAfterSeconds * 1000;
                            }
                        }

                        console.error(`[TestRailClient] Rate limited or server error (${response.status}). Retrying in ${delayMs}ms...`);
                        await this.delay(delayMs);
                        attempt++;
                        continue;
                    }

                    let errorMessage = `TestRail API Error: ${response.status} ${response.statusText}`;
                    const errorText = await response.text();
                    errorMessage += ` - ${errorText}`;
                    console.error(`[TestRailClient] Error Details: ${errorMessage}`);
                    throw new Error(errorMessage);
                }

                return await response.json() as T;
            } catch (error) {
                const networkError = error instanceof Error && !error.message.startsWith('TestRail API Error');
                if (networkError && attempt < maxRetries) {
                    const delayMs = baseDelayMs * Math.pow(2, attempt);
                    console.error(`[TestRailClient] Network error (${error.message}). Retrying in ${delayMs}ms...`);
                    await this.delay(delayMs);
                    attempt++;
                    continue;
                }

                if (networkError) {
                    console.error(`[TestRailClient] Request Failed: ${method} ${endpoint} - ${error.message}`);
                }
                throw error;
            }
        }

        throw new Error(`[TestRailClient] Max retries (${maxRetries}) exceeded for ${method} ${endpoint}`);
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
