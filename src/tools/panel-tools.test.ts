import { describe, it, expect, beforeEach, vi } from 'vitest';
import { panelTools } from './panel-tools.js';
import { DirectusClient } from '../directus-client.js';

describe('Panel Tools', () => {
  let mockClient: {
    [K in keyof DirectusClient]: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockClient = {
      listPanels: vi.fn(),
      getPanel: vi.fn(),
      createPanel: vi.fn(),
      createPanels: vi.fn(),
      updatePanel: vi.fn(),
      updatePanels: vi.fn(),
      deletePanel: vi.fn(),
      deletePanels: vi.fn(),
    } as any;
  });

  describe('list_panels', () => {
    it('should list all panels', async () => {
      const mockData = {
        data: [
          { id: 'panel-1', name: 'Panel 1', type: 'metric', dashboard: 'dash-1' },
          { id: 'panel-2', name: 'Panel 2', type: 'time-series', dashboard: 'dash-1' },
        ],
      };
      mockClient.listPanels.mockResolvedValue(mockData);

      const tool = panelTools.find((t) => t.name === 'list_panels');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, {});
      expect(result.content[0].text).toBe(JSON.stringify(mockData, null, 2));
      expect(mockClient.listPanels).toHaveBeenCalledWith({});
    });

    it('should list panels with filter', async () => {
      const mockData = {
        data: [{ id: 'panel-1', name: 'Panel 1', type: 'metric', dashboard: 'dash-1' }],
      };
      mockClient.listPanels.mockResolvedValue(mockData);

      const tool = panelTools.find((t) => t.name === 'list_panels');
      await tool!.handler(mockClient as any, {
        filter: { dashboard: { _eq: 'dash-1' } },
      });

      expect(mockClient.listPanels).toHaveBeenCalledWith({
        filter: { dashboard: { _eq: 'dash-1' } },
      });
    });

    it('should list panels with multiple parameters', async () => {
      mockClient.listPanels.mockResolvedValue({ data: [] });

      const tool = panelTools.find((t) => t.name === 'list_panels');
      await tool!.handler(mockClient as any, {
        fields: ['id', 'name', 'type'],
        filter: { dashboard: { _eq: 'dash-1' } },
        search: 'test',
        sort: ['position_y', 'position_x'],
        limit: 20,
        offset: 0,
        meta: 'total_count',
      });

      expect(mockClient.listPanels).toHaveBeenCalledWith({
        fields: ['id', 'name', 'type'],
        filter: { dashboard: { _eq: 'dash-1' } },
        search: 'test',
        sort: ['position_y', 'position_x'],
        limit: 20,
        offset: 0,
        meta: 'total_count',
      });
    });
  });

  describe('get_panel', () => {
    it('should get a single panel by ID', async () => {
      const mockData = {
        id: 'panel-1',
        name: 'Test Panel',
        type: 'time-series',
        dashboard: 'dash-1',
        position_x: 0,
        position_y: 0,
        width: 6,
        height: 4,
      };
      mockClient.getPanel.mockResolvedValue(mockData);

      const tool = panelTools.find((t) => t.name === 'get_panel');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, {
        id: 'panel-1',
      });
      expect(result.content[0].text).toBe(JSON.stringify(mockData, null, 2));
      expect(mockClient.getPanel).toHaveBeenCalledWith('panel-1', {});
    });

    it('should get panel with fields and meta', async () => {
      mockClient.getPanel.mockResolvedValue({ id: 'panel-1' });

      const tool = panelTools.find((t) => t.name === 'get_panel');
      await tool!.handler(mockClient as any, {
        id: 'panel-1',
        fields: ['id', 'name', 'type'],
        meta: 'total_count',
      });

      expect(mockClient.getPanel).toHaveBeenCalledWith('panel-1', {
        fields: ['id', 'name', 'type'],
        meta: 'total_count',
      });
    });

    it('should validate id is required', () => {
      const tool = panelTools.find((t) => t.name === 'get_panel');
      expect(() => {
        tool!.inputSchema.parse({});
      }).toThrow();
    });
  });

  describe('create_panel', () => {
    it('should create a new panel', async () => {
      const panelData = {
        dashboard: 'dash-1',
        name: 'New Panel',
        type: 'metric',
        position_x: 0,
        position_y: 0,
        width: 3,
        height: 2,
      };
      const mockResponse = { id: 'panel-1', ...panelData };
      mockClient.createPanel.mockResolvedValue(mockResponse);

      const tool = panelTools.find((t) => t.name === 'create_panel');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, panelData);
      expect(mockClient.createPanel).toHaveBeenCalledWith(panelData);
      expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
    });

    it('should create panel with minimal required fields', async () => {
      const panelData = {
        dashboard: 'dash-1',
        name: 'Minimal Panel',
        type: 'metric',
        position_x: 0,
        position_y: 0,
        width: 3,
        height: 2,
      };
      const mockResponse = { id: 'panel-1', ...panelData };
      mockClient.createPanel.mockResolvedValue(mockResponse);

      const tool = panelTools.find((t) => t.name === 'create_panel');
      await tool!.handler(mockClient as any, panelData);

      expect(mockClient.createPanel).toHaveBeenCalledWith(panelData);
    });

    it('should create panel with all optional fields', async () => {
      const panelData = {
        dashboard: 'dash-1',
        name: 'Complete Panel',
        icon: 'chart',
        color: '#FF5722',
        show_header: true,
        note: 'Complete panel description',
        type: 'time-series',
        position_x: 1,
        position_y: 2,
        width: 6,
        height: 4,
        options: { collection: 'sales', field: 'revenue' },
        user_created: 'user-uuid',
        date_created: '2024-01-01T00:00:00Z',
      };
      mockClient.createPanel.mockResolvedValue({ id: 'panel-1', ...panelData });

      const tool = panelTools.find((t) => t.name === 'create_panel');
      await tool!.handler(mockClient as any, panelData);

      expect(mockClient.createPanel).toHaveBeenCalledWith(panelData);
    });

    it('should validate required fields', () => {
      const tool = panelTools.find((t) => t.name === 'create_panel');

      // Missing dashboard
      expect(() => {
        tool!.inputSchema.parse({
          name: 'Panel',
          type: 'metric',
          position_x: 0,
          position_y: 0,
          width: 3,
          height: 2,
        });
      }).toThrow();

      // Missing name
      expect(() => {
        tool!.inputSchema.parse({
          dashboard: 'dash-1',
          type: 'metric',
          position_x: 0,
          position_y: 0,
          width: 3,
          height: 2,
        });
      }).toThrow();

      // Missing type
      expect(() => {
        tool!.inputSchema.parse({
          dashboard: 'dash-1',
          name: 'Panel',
          position_x: 0,
          position_y: 0,
          width: 3,
          height: 2,
        });
      }).toThrow();

      // Missing position_x
      expect(() => {
        tool!.inputSchema.parse({
          dashboard: 'dash-1',
          name: 'Panel',
          type: 'metric',
          position_y: 0,
          width: 3,
          height: 2,
        });
      }).toThrow();

      // Missing position_y
      expect(() => {
        tool!.inputSchema.parse({
          dashboard: 'dash-1',
          name: 'Panel',
          type: 'metric',
          position_x: 0,
          width: 3,
          height: 2,
        });
      }).toThrow();

      // Missing width
      expect(() => {
        tool!.inputSchema.parse({
          dashboard: 'dash-1',
          name: 'Panel',
          type: 'metric',
          position_x: 0,
          position_y: 0,
          height: 2,
        });
      }).toThrow();

      // Missing height
      expect(() => {
        tool!.inputSchema.parse({
          dashboard: 'dash-1',
          name: 'Panel',
          type: 'metric',
          position_x: 0,
          position_y: 0,
          width: 3,
        });
      }).toThrow();
    });
  });

  describe('create_panels', () => {
    it('should create multiple panels', async () => {
      const panelsData = {
        panels: [
          {
            dashboard: 'dash-1',
            name: 'Panel 1',
            type: 'metric',
            position_x: 0,
            position_y: 0,
            width: 3,
            height: 2,
          },
          {
            dashboard: 'dash-1',
            name: 'Panel 2',
            type: 'chart',
            position_x: 3,
            position_y: 0,
            width: 3,
            height: 2,
          },
        ],
      };
      const mockResponse = {
        data: [
          { id: 'panel-1', dashboard: 'dash-1', name: 'Panel 1', type: 'metric', position_x: 0, position_y: 0, width: 3, height: 2 },
          { id: 'panel-2', dashboard: 'dash-1', name: 'Panel 2', type: 'chart', position_x: 3, position_y: 0, width: 3, height: 2 },
        ],
      };
      mockClient.createPanels.mockResolvedValue(mockResponse);

      const tool = panelTools.find((t) => t.name === 'create_panels');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, panelsData);
      expect(mockClient.createPanels).toHaveBeenCalledWith(panelsData.panels);
      expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
    });

    it('should validate panels array is required', () => {
      const tool = panelTools.find((t) => t.name === 'create_panels');
      expect(() => {
        tool!.inputSchema.parse({});
      }).toThrow();
    });
  });

  describe('update_panel', () => {
    it('should update a panel', async () => {
      const updateData = {
        id: 'panel-1',
        name: 'Updated Panel',
        position_x: 1,
        position_y: 2,
        width: 8,
      };
      const mockResponse = { id: 'panel-1', name: 'Updated Panel', position_x: 1, position_y: 2, width: 8 };
      mockClient.updatePanel.mockResolvedValue(mockResponse);

      const tool = panelTools.find((t) => t.name === 'update_panel');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, updateData);
      expect(mockClient.updatePanel).toHaveBeenCalledWith('panel-1', {
        name: 'Updated Panel',
        position_x: 1,
        position_y: 2,
        width: 8,
      });
      expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
    });

    it('should validate id is required', () => {
      const tool = panelTools.find((t) => t.name === 'update_panel');
      expect(() => {
        tool!.inputSchema.parse({});
      }).toThrow();
    });
  });

  describe('update_panels', () => {
    it('should update multiple panels', async () => {
      const panelsData = {
        panels: [
          { id: 'panel-1', name: 'Updated 1', position_x: 2 },
          { id: 'panel-2', height: 3, width: 4 },
        ],
      };
      const mockResponse = {
        data: [
          { id: 'panel-1', name: 'Updated 1', position_x: 2 },
          { id: 'panel-2', height: 3, width: 4 },
        ],
      };
      mockClient.updatePanels.mockResolvedValue(mockResponse);

      const tool = panelTools.find((t) => t.name === 'update_panels');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, panelsData);
      expect(mockClient.updatePanels).toHaveBeenCalledWith(panelsData.panels);
      expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
    });
  });

  describe('delete_panel', () => {
    it('should delete a panel', async () => {
      mockClient.deletePanel.mockResolvedValue({ success: true });

      const tool = panelTools.find((t) => t.name === 'delete_panel');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, { id: 'panel-1' });
      expect(mockClient.deletePanel).toHaveBeenCalledWith('panel-1');
      expect(result.content[0].text).toBe('Panel panel-1 deleted successfully');
    });

    it('should validate id is required', () => {
      const tool = panelTools.find((t) => t.name === 'delete_panel');
      expect(() => {
        tool!.inputSchema.parse({});
      }).toThrow();
    });
  });

  describe('delete_panels', () => {
    it('should delete multiple panels', async () => {
      mockClient.deletePanels.mockResolvedValue({ success: true });

      const tool = panelTools.find((t) => t.name === 'delete_panels');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, { ids: ['panel-1', 'panel-2'] });
      expect(mockClient.deletePanels).toHaveBeenCalledWith(['panel-1', 'panel-2']);
      expect(result.content[0].text).toBe('2 panels deleted successfully');
    });

    it('should validate ids array is required', () => {
      const tool = panelTools.find((t) => t.name === 'delete_panels');
      expect(() => {
        tool!.inputSchema.parse({});
      }).toThrow();
    });
  });
});
