import { describe, it, expect, beforeEach, vi } from 'vitest';
import { dashboardTools } from './dashboard-tools.js';
import { DirectusClient } from '../directus-client.js';

describe('Dashboard Tools', () => {
  let mockClient: {
    [K in keyof DirectusClient]: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockClient = {
      listDashboards: vi.fn(),
      getDashboard: vi.fn(),
      createDashboard: vi.fn(),
      createDashboards: vi.fn(),
      updateDashboard: vi.fn(),
      updateDashboards: vi.fn(),
      deleteDashboard: vi.fn(),
      deleteDashboards: vi.fn(),
    } as any;
  });

  describe('list_dashboards', () => {
    it('should list all dashboards', async () => {
      const mockData = {
        data: [
          { id: 'dash-1', name: 'Dashboard 1', icon: 'dashboard' },
          { id: 'dash-2', name: 'Dashboard 2', icon: 'analytics' },
        ],
      };
      mockClient.listDashboards.mockResolvedValue(mockData);

      const tool = dashboardTools.find((t) => t.name === 'list_dashboards');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, {});
      expect(result.content[0].text).toBe(JSON.stringify(mockData, null, 2));
      expect(mockClient.listDashboards).toHaveBeenCalledWith({});
    });

    it('should list dashboards with filter', async () => {
      const mockData = {
        data: [{ id: 'dash-1', name: 'Dashboard 1', icon: 'dashboard' }],
      };
      mockClient.listDashboards.mockResolvedValue(mockData);

      const tool = dashboardTools.find((t) => t.name === 'list_dashboards');
      await tool!.handler(mockClient as any, {
        filter: { name: { _contains: 'sales' } },
      });

      expect(mockClient.listDashboards).toHaveBeenCalledWith({
        filter: { name: { _contains: 'sales' } },
      });
    });

    it('should list dashboards with multiple parameters', async () => {
      mockClient.listDashboards.mockResolvedValue({ data: [] });

      const tool = dashboardTools.find((t) => t.name === 'list_dashboards');
      await tool!.handler(mockClient as any, {
        fields: ['id', 'name', 'icon'],
        filter: { color: { _neq: null } },
        search: 'test',
        sort: ['-date_created'],
        limit: 10,
        offset: 0,
        meta: 'total_count',
      });

      expect(mockClient.listDashboards).toHaveBeenCalledWith({
        fields: ['id', 'name', 'icon'],
        filter: { color: { _neq: null } },
        search: 'test',
        sort: ['-date_created'],
        limit: 10,
        offset: 0,
        meta: 'total_count',
      });
    });
  });

  describe('get_dashboard', () => {
    it('should get a single dashboard by ID', async () => {
      const mockData = {
        id: 'dash-1',
        name: 'Test Dashboard',
        icon: 'dashboard',
        color: '#FF5722',
      };
      mockClient.getDashboard.mockResolvedValue(mockData);

      const tool = dashboardTools.find((t) => t.name === 'get_dashboard');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, {
        id: 'dash-1',
      });
      expect(result.content[0].text).toBe(JSON.stringify(mockData, null, 2));
      expect(mockClient.getDashboard).toHaveBeenCalledWith('dash-1', {});
    });

    it('should get dashboard with fields and meta', async () => {
      mockClient.getDashboard.mockResolvedValue({ id: 'dash-1' });

      const tool = dashboardTools.find((t) => t.name === 'get_dashboard');
      await tool!.handler(mockClient as any, {
        id: 'dash-1',
        fields: ['id', 'name'],
        meta: 'total_count',
      });

      expect(mockClient.getDashboard).toHaveBeenCalledWith('dash-1', {
        fields: ['id', 'name'],
        meta: 'total_count',
      });
    });

    it('should validate id is required', () => {
      const tool = dashboardTools.find((t) => t.name === 'get_dashboard');
      expect(() => {
        tool!.inputSchema.parse({});
      }).toThrow();
    });
  });

  describe('create_dashboard', () => {
    it('should create a new dashboard', async () => {
      const dashboardData = {
        name: 'New Dashboard',
        icon: 'dashboard',
        color: '#FF5722',
      };
      const mockResponse = { id: 'dash-1', ...dashboardData };
      mockClient.createDashboard.mockResolvedValue(mockResponse);

      const tool = dashboardTools.find((t) => t.name === 'create_dashboard');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, dashboardData);
      expect(mockClient.createDashboard).toHaveBeenCalledWith(dashboardData);
      expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
    });

    it('should create dashboard with minimal required fields', async () => {
      const dashboardData = { name: 'Minimal Dashboard' };
      const mockResponse = { id: 'dash-1', ...dashboardData };
      mockClient.createDashboard.mockResolvedValue(mockResponse);

      const tool = dashboardTools.find((t) => t.name === 'create_dashboard');
      await tool!.handler(mockClient as any, dashboardData);

      expect(mockClient.createDashboard).toHaveBeenCalledWith(dashboardData);
    });

    it('should create dashboard with all optional fields', async () => {
      const dashboardData = {
        name: 'Complete Dashboard',
        icon: 'analytics',
        note: 'Complete dashboard description',
        color: '#4CAF50',
        user_created: 'user-uuid',
        date_created: '2024-01-01T00:00:00Z',
      };
      mockClient.createDashboard.mockResolvedValue({ id: 'dash-1', ...dashboardData });

      const tool = dashboardTools.find((t) => t.name === 'create_dashboard');
      await tool!.handler(mockClient as any, dashboardData);

      expect(mockClient.createDashboard).toHaveBeenCalledWith(dashboardData);
    });

    it('should validate name is required', () => {
      const tool = dashboardTools.find((t) => t.name === 'create_dashboard');
      expect(() => {
        tool!.inputSchema.parse({});
      }).toThrow();
    });
  });

  describe('create_dashboards', () => {
    it('should create multiple dashboards', async () => {
      const dashboardsData = {
        dashboards: [
          { name: 'Dashboard 1', icon: 'dashboard' },
          { name: 'Dashboard 2', icon: 'analytics' },
        ],
      };
      const mockResponse = {
        data: [
          { id: 'dash-1', name: 'Dashboard 1', icon: 'dashboard' },
          { id: 'dash-2', name: 'Dashboard 2', icon: 'analytics' },
        ],
      };
      mockClient.createDashboards.mockResolvedValue(mockResponse);

      const tool = dashboardTools.find((t) => t.name === 'create_dashboards');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, dashboardsData);
      expect(mockClient.createDashboards).toHaveBeenCalledWith(dashboardsData.dashboards);
      expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
    });

    it('should validate dashboards array is required', () => {
      const tool = dashboardTools.find((t) => t.name === 'create_dashboards');
      expect(() => {
        tool!.inputSchema.parse({});
      }).toThrow();
    });
  });

  describe('update_dashboard', () => {
    it('should update a dashboard', async () => {
      const updateData = {
        id: 'dash-1',
        name: 'Updated Dashboard',
        color: '#4CAF50',
      };
      const mockResponse = { id: 'dash-1', name: 'Updated Dashboard', color: '#4CAF50' };
      mockClient.updateDashboard.mockResolvedValue(mockResponse);

      const tool = dashboardTools.find((t) => t.name === 'update_dashboard');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, updateData);
      expect(mockClient.updateDashboard).toHaveBeenCalledWith('dash-1', {
        name: 'Updated Dashboard',
        color: '#4CAF50',
      });
      expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
    });

    it('should validate id is required', () => {
      const tool = dashboardTools.find((t) => t.name === 'update_dashboard');
      expect(() => {
        tool!.inputSchema.parse({});
      }).toThrow();
    });
  });

  describe('update_dashboards', () => {
    it('should update multiple dashboards', async () => {
      const dashboardsData = {
        dashboards: [
          { id: 'dash-1', name: 'Updated 1' },
          { id: 'dash-2', color: '#FF9800' },
        ],
      };
      const mockResponse = {
        data: [
          { id: 'dash-1', name: 'Updated 1' },
          { id: 'dash-2', color: '#FF9800' },
        ],
      };
      mockClient.updateDashboards.mockResolvedValue(mockResponse);

      const tool = dashboardTools.find((t) => t.name === 'update_dashboards');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, dashboardsData);
      expect(mockClient.updateDashboards).toHaveBeenCalledWith(dashboardsData.dashboards);
      expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
    });
  });

  describe('delete_dashboard', () => {
    it('should delete a dashboard', async () => {
      mockClient.deleteDashboard.mockResolvedValue({ success: true });

      const tool = dashboardTools.find((t) => t.name === 'delete_dashboard');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, { id: 'dash-1' });
      expect(mockClient.deleteDashboard).toHaveBeenCalledWith('dash-1');
      expect(result.content[0].text).toBe('Dashboard dash-1 deleted successfully');
    });

    it('should validate id is required', () => {
      const tool = dashboardTools.find((t) => t.name === 'delete_dashboard');
      expect(() => {
        tool!.inputSchema.parse({});
      }).toThrow();
    });
  });

  describe('delete_dashboards', () => {
    it('should delete multiple dashboards', async () => {
      mockClient.deleteDashboards.mockResolvedValue({ success: true });

      const tool = dashboardTools.find((t) => t.name === 'delete_dashboards');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, { ids: ['dash-1', 'dash-2'] });
      expect(mockClient.deleteDashboards).toHaveBeenCalledWith(['dash-1', 'dash-2']);
      expect(result.content[0].text).toBe('2 dashboards deleted successfully');
    });

    it('should validate ids array is required', () => {
      const tool = dashboardTools.find((t) => t.name === 'delete_dashboards');
      expect(() => {
        tool!.inputSchema.parse({});
      }).toThrow();
    });
  });
});
