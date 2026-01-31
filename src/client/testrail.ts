import axios, { AxiosInstance, AxiosError } from "axios";
import { Case, Section, Priority, CaseType, CaseField } from "../types/testrail.js";

export class TestRailClient {
    private client: AxiosInstance;
    private caseFieldsPromise: Promise<CaseField[]> | null = null;

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
        return this.makeRequest<Priority[]>('/index.php?/api/v2/get_priorities');
    }

    async getCaseTypes(): Promise<CaseType[]> {
        return this.makeRequest<CaseType[]>('/index.php?/api/v2/get_case_types');
    }

    async getCaseFields(): Promise<CaseField[]> {
        if (!this.caseFieldsPromise) {
            this.caseFieldsPromise = this.makeRequest<CaseField[]>('/index.php?/api/v2/get_case_fields');
        }
        return this.caseFieldsPromise;
    }

    private async makeRequest<T>(url: string): Promise<T> {
        try {
            const response = await this.client.get<T>(url);
            return response.data;
        } catch (error: any) {
            let errorMessage = `TestRail API error: ${error.message}`;

            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                if (axiosError.response) {
                    errorMessage = `TestRail API error: ${axiosError.response.status} ${axiosError.response.statusText} - ${JSON.stringify(axiosError.response.data)}`;
                } else if (axiosError.request) {
                    errorMessage = `TestRail API error: No response received. ${axiosError.message}`;
                }
            }

            throw new Error(errorMessage);
        }
    }
}
