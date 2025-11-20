import { z } from 'zod';
import { createTool, createActionTool } from './tool-helpers.js';
import {
  UuidSchema,
  FieldsSchema,
  FilterSchema,
  SearchSchema,
  SortSchema,
  LimitSchema,
  OffsetSchema,
  MetaSchema,
} from './validators.js';

// Zod schemas for validation
const ListDashboardsSchema = z.object({
  fields: FieldsSchema,
  filter: FilterSchema,
  search: SearchSchema,
  sort: SortSchema,
  limit: LimitSchema,
  offset: OffsetSchema,
  meta: MetaSchema,
});

const GetDashboardSchema = z.object({
  id: UuidSchema.describe('Dashboard ID (UUID)'),
  fields: FieldsSchema,
  meta: MetaSchema,
});

const CreateDashboardSchema = z.object({
  name: z.string().min(1).describe('Name of the dashboard'),
  icon: z.string().optional().describe('Material icon for dashboard'),
  note: z.string().optional().describe('Descriptive text about the dashboard'),
  color: z.string().optional().describe('Accent color for the dashboard'),
  user_created: UuidSchema.optional().describe('User that created the dashboard (UUID)'),
  date_created: z.string().optional().describe('When the dashboard was created (ISO 8601)'),
});

const CreateDashboardsSchema = z.object({
  dashboards: z.array(CreateDashboardSchema).describe('Array of dashboards to create'),
});

const UpdateDashboardSchema = z.object({
  id: UuidSchema.describe('Dashboard ID (UUID) to update'),
  name: z.string().optional().describe('Name of the dashboard'),
  icon: z.string().optional().describe('Material icon for dashboard'),
  note: z.string().optional().describe('Descriptive text about the dashboard'),
  color: z.string().optional().describe('Accent color for the dashboard'),
});

const UpdateDashboardsSchema = z.object({
  dashboards: z.array(UpdateDashboardSchema).describe('Array of dashboards to update (each must include id)'),
});

const DeleteDashboardSchema = z.object({
  id: UuidSchema.describe('Dashboard ID (UUID) to delete'),
});

const DeleteDashboardsSchema = z.object({
  ids: z.array(z.string()).describe('Array of dashboard IDs (UUIDs) to delete'),
});

// Tool implementations
export const dashboardTools = [
  createTool({
    name: 'list_dashboards',
    description: 'List all dashboards that exist in Directus. Supports filtering, sorting, pagination, and search. Example: {filter: {"name": {"_contains": "sales"}}, sort: ["-date_created"], limit: 10}',
    inputSchema: ListDashboardsSchema,
    toolsets: ['dashboards'],
    handler: (client, args) => client.listDashboards(args),
  }),
  createTool({
    name: 'get_dashboard',
    description: 'Get a single dashboard by ID from Directus. Optionally specify fields to return and metadata options.',
    inputSchema: GetDashboardSchema,
    toolsets: ['dashboards'],
    handler: async (client, args) => {
      const { id, ...params } = args;
      return client.getDashboard(id, params);
    },
  }),
  createTool({
    name: 'create_dashboard',
    description: 'Create a new dashboard in Directus. Provide the dashboard data including name and optional configuration. Example: {name: "Sales Dashboard", icon: "analytics", color: "#FF5722", note: "Main sales metrics"}',
    inputSchema: CreateDashboardSchema,
    toolsets: ['dashboards'],
    handler: (client, args) => client.createDashboard(args),
  }),
  createTool({
    name: 'create_dashboards',
    description: 'Create multiple dashboards in Directus at once. More efficient than creating dashboards one by one. Example: {dashboards: [{name: "Dashboard 1", icon: "dashboard"}, {name: "Dashboard 2", icon: "analytics"}]}',
    inputSchema: CreateDashboardsSchema,
    toolsets: ['dashboards'],
    handler: async (client, args) => client.createDashboards(args.dashboards),
  }),
  createTool({
    name: 'update_dashboard',
    description: 'Update an existing dashboard in Directus. Provide the dashboard ID and fields to update. Example: {id: "dashboard-uuid", name: "Updated Dashboard Name", color: "#4CAF50"}',
    inputSchema: UpdateDashboardSchema,
    toolsets: ['dashboards'],
    handler: async (client, args) => {
      const { id, ...data } = args;
      return client.updateDashboard(id, data);
    },
  }),
  createTool({
    name: 'update_dashboards',
    description: 'Update multiple dashboards in Directus at once. Each dashboard must include an id field. Example: {dashboards: [{id: "uuid-1", name: "Updated Name 1"}, {id: "uuid-2", color: "#FF9800"}]}',
    inputSchema: UpdateDashboardsSchema,
    toolsets: ['dashboards'],
    handler: async (client, args) => client.updateDashboards(args.dashboards),
  }),
  createActionTool({
    name: 'delete_dashboard',
    description: 'Delete a dashboard from Directus by ID. This action cannot be undone.',
    inputSchema: DeleteDashboardSchema,
    toolsets: ['dashboards'],
    handler: async (client, args) => client.deleteDashboard(args.id),
    successMessage: (args) => `Dashboard ${args.id} deleted successfully`,
  }),
  createActionTool({
    name: 'delete_dashboards',
    description: 'Delete multiple dashboards from Directus at once by their IDs. This action cannot be undone. Example: {ids: ["uuid-1", "uuid-2", "uuid-3"]}',
    inputSchema: DeleteDashboardsSchema,
    toolsets: ['dashboards'],
    handler: async (client, args) => client.deleteDashboards(args.ids),
    successMessage: (args) => `${args.ids.length} dashboards deleted successfully`,
  }),
];
