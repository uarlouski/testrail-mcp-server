import { z } from "zod";
import { processCustomFields } from "../utils/mapper.js";
import { TestRailClient } from "../client/testrail.js";
import { TestCaseResponse, ToolDefinition } from "../types/custom.js";

const parameters = {
    case_id: z.string().describe("The ID of the test case (e.g. '123' or 'C123')"),
};

export const getCaseTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "get_case",
    description: "Get a test case from TestRail by ID",
    parameters,
    handler: async ({ case_id }, client) => {
        const id = case_id.toUpperCase().startsWith("C") ? case_id.substring(1) : case_id;
        const testCase = await client.getCase(id);

        const [section, caseTypes, priorities, caseFields] = await Promise.all([
            client.getSection(testCase.section_id.toString()),
            client.getCaseTypes(),
            client.getPriorities(),
            client.getCaseFields()
        ]);

        const caseType = caseTypes.find(t => t.id === testCase.type_id);
        const priority = priorities.find(p => p.id === testCase.priority_id);

        const customFields = processCustomFields(testCase, caseFields);

        const response: TestCaseResponse = {
            id: testCase.id,
            title: testCase.title,
            section: section.name,
            type: caseType ? caseType.name : "Unknown",
            priority: priority ? priority.name : "Unknown",
            labels: testCase.labels || [],
            references: testCase.refs,
            updated_on: testCase.updated_on,
            ...customFields
        };

        return response;
    }
};
