import axios, { AxiosInstance, AxiosError } from "axios";
import { Case, Section, Priority, CaseType, CaseField, Template, Project } from "../types/testrail.js";

export class TestRailClient {
    private client: AxiosInstance;
    private prioritiesPromise: Promise<Priority[]> | null = null;
    private caseTypesPromise: Promise<CaseType[]> | null = null;
    private caseFieldsPromise: Promise<CaseField[]> | null = null;
    private projectsPromise: Promise<Project[]> | null = null;
    private templatesPromiseMap: Map<string, Promise<Template[]>> = new Map();

    constructor(baseUrl: string, email: string, apiKey: string) {
        const cleanedBaseUrl = baseUrl.replace(/\/$/, "");

        this.client = axios.create({
            baseURL: cleanedBaseUrl,
            headers: {
                "Content-Type": "application/json",
            },
            auth: {
                username: email,
                password: apiKey,
            },
            validateStatus: (status: number) => {
                return status >= 200 && status < 300;
            }
        });
    }

    async getCase(caseId: string): Promise<Case> {
        return this.makeRequest<Case>(`/index.php?/api/v2/get_case/${caseId}`);
    }

    async getSection(sectionId: string): Promise<Section> {
        return this.makeRequest<Section>(`/index.php?/api/v2/get_section/${sectionId}`);
    }

    async getPriorities(): Promise<Priority[]> {
        if (!this.prioritiesPromise) {
            this.prioritiesPromise = this.makeRequest<Priority[]>('/index.php?/api/v2/get_priorities');
        }
        return this.prioritiesPromise;
    }

    async getCaseTypes(): Promise<CaseType[]> {
        if (!this.caseTypesPromise) {
            this.caseTypesPromise = this.makeRequest<CaseType[]>('/index.php?/api/v2/get_case_types');
        }
        return this.caseTypesPromise;
    }

    async getCaseFields(): Promise<CaseField[]> {
        if (!this.caseFieldsPromise) {
            this.caseFieldsPromise = this.makeRequest<CaseField[]>('/index.php?/api/v2/get_case_fields');
        }
        return this.caseFieldsPromise;
    }

    async getTemplates(projectId: string): Promise<Template[]> {
        if (!this.templatesPromiseMap.has(projectId)) {
            this.templatesPromiseMap.set(
                projectId,
                this.makeRequest<Template[]>(`/index.php?/api/v2/get_templates/${projectId}`)
            );
        }
        return this.templatesPromiseMap.get(projectId)!;
    }

    async updateCase(caseId: string, fields: Record<string, any>): Promise<Case> {
        return this.postRequest<Case>(`/index.php?/api/v2/update_case/${caseId}`, fields);
    }

    async createCase(sectionId: string, fields: Record<string, any>): Promise<Case> {
        return this.postRequest<Case>(`/index.php?/api/v2/add_case/${sectionId}`, fields);
    }

    async getSections(projectId: string): Promise<Section[]> {
        return this.makeRequest<Section[]>(`/index.php?/api/v2/get_sections/${projectId}`);
    }

    async getProjects(): Promise<Project[]> {
        if (!this.projectsPromise) {
            this.projectsPromise = this.makeRequest<Project[]>('/index.php?/api/v2/get_projects');
        }
        return this.projectsPromise;
    }

    private async makeRequest<T>(url: string): Promise<T> {
        try {
            const response = await this.client.get<T>(url);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    }

    private async postRequest<T>(url: string, data: Record<string, any>): Promise<T> {
        try {
            const response = await this.client.post<T>(url, data);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    }

    private handleError(error: any): Error {
        let errorMessage = `TestRail API error: ${error.message}`;

        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            if (axiosError.response) {
                errorMessage = `TestRail API error: ${axiosError.response.status} ${axiosError.response.statusText} - ${JSON.stringify(axiosError.response.data)}`;
            } else if (axiosError.request) {
                errorMessage = `TestRail API error: No response received. ${axiosError.message}`;
            }
        }

        return new Error(errorMessage);
    }
}
