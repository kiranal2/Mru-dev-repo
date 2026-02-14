'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ModuleRegistry, AllCommunityModule, ICellRendererParams } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Download, MoreHorizontal, MoreVertical, Upload, Edit } from 'lucide-react';
import { CheckCircle2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UploadTemplateModal } from '@/components/modals/upload-template-modal';
import { EditTemplateModal } from '@/components/modals/edit-template-modal';
import Breadcrumb from '@/components/layout/breadcrumb';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

interface ApiTemplate {
  template_id: string;
  template_name: string;
  template_description: string;
  prompt_id: string;
  prompt_text: string;
  template_current_version: string;
  template_status: 'DRAFT' | 'ACTIVE';
  last_modified_date: string;
  created_date: string;
  created_by: {
    first_name: string;
    last_name: string;
    user_id: string;
  };
  last_modified_by: {
    first_name: string;
    last_name: string;
    user_id: string;
  };
  total_runs: number;
  last_run: {
    run_id: string;
    run_start_time: string;
    run_status: string;
  } | null;
}

interface ApiRun {
  template_id: string;
  template_name: string;
  template_version: string;
  prompt_text: string;
  run_id: string;
  run_version: string;
  run_by: {
    user_id: string;
    first_name: string;
    last_name: string;
  };
  parameters: string;
  start_time: string;
  end_time: string;
  status: string;
}

interface DataTemplate {
  actions?: string;
  name: string;
  description: string;
  prompt: string;
  status: 'Draft' | 'Active';
  lastRun: string | null;
  totalRuns: number;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

interface DataRun {
  actions?: string;
  runId: string;
  runAt: string;
  runBy: string;
  parameters: string;
  templateName: string;
  prompt: string;
  owner: string;
}

export default function DataTemplatePage() {
  const [activeTab, setActiveTab] = useState('templates');
  const [templates, setTemplates] = useState<DataTemplate[]>([]);
  const [runs, setRuns] = useState<DataRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DataTemplate | null>(null);
  const templatesGridRef = useRef<AgGridReact>(null);
  const runsGridRef = useRef<AgGridReact>(null);

  // Fetch templates and runs data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch templates
        const templatesResponse = await fetch('/api/data-templates');
        if (!templatesResponse.ok) {
          throw new Error(`Failed to fetch templates: ${templatesResponse.statusText}`);
        }
        const templatesData = await templatesResponse.json();
        console.log('Templates data received:', templatesData);
        
        const transformedTemplates: DataTemplate[] = templatesData.data.map((template: ApiTemplate) => {
          // Format last run date
          let lastRunFormatted = null;
          if (template.last_run) {
            const lastRunDate = new Date(template.last_run.run_start_time);
            lastRunFormatted = lastRunDate.toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            });
          }

          // Format created date
          const createdDate = new Date(template.created_date);
          const createdAtFormatted = createdDate.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          });

          // Format updated date
          const updatedDate = new Date(template.last_modified_date);
          const updatedAtFormatted = updatedDate.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          });

          return {
            actions: '',
            name: template.template_name,
            description: template.template_description,
            prompt: template.prompt_text,
            status: template.template_status === 'ACTIVE' ? 'Active' : 'Draft',
            lastRun: lastRunFormatted,
            totalRuns: template.total_runs,
            owner: `${template.created_by.first_name} ${template.created_by.last_name}`,
            createdAt: createdAtFormatted,
            updatedAt: updatedAtFormatted,
          };
        });
        
        console.log('Transformed templates:', transformedTemplates);
        setTemplates(transformedTemplates);

        // Fetch runs
        const runsResponse = await fetch('/api/data-templates/runs');
        if (!runsResponse.ok) {
          throw new Error(`Failed to fetch runs: ${runsResponse.statusText}`);
        }
        const runsData = await runsResponse.json();
        console.log('Runs data received:', runsData);
        
        const transformedRuns: DataRun[] = runsData.runs.map((run: ApiRun) => {
          // Format date from ISO string to readable format
          const date = new Date(run.start_time);
          const formattedDate = date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          });
          
          return {
            actions: '',
            runId: run.run_id,
            runAt: formattedDate,
            runBy: `${run.run_by.first_name} ${run.run_by.last_name}`,
            parameters: run.parameters,
            templateName: run.template_name,
            prompt: run.prompt_text,
            owner: `${run.run_by.first_name} ${run.run_by.last_name}`,
          };
        });
        
        console.log('Transformed runs:', transformedRuns);
        setRuns(transformedRuns);
        setError(null);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle upload template
  const handleUploadTemplate = () => {
    setUploadModalOpen(true);
  };

  // Handle edit template
  const handleEditTemplate = (template: DataTemplate) => {
    setSelectedTemplate(template);
    setEditModalOpen(true);
  };

  // Handle save template edit
  const handleSaveTemplate = (name: string, description: string) => {
    if (selectedTemplate) {
      // Update the template in the state
      setTemplates(prevTemplates =>
        prevTemplates.map(template =>
          template.name === selectedTemplate.name
            ? { ...template, name, description }
            : template
        )
      );
    }
  };

  // Handle upload success
  const handleUploadSuccess = () => {
    // Refresh the data
    const fetchData = async () => {
      try {
        const templatesResponse = await fetch('/api/data-templates');
        if (templatesResponse.ok) {
          const templatesData = await templatesResponse.json();
          const transformedTemplates: DataTemplate[] = templatesData.data.map((template: ApiTemplate) => {
            let lastRunFormatted = null;
            if (template.last_run) {
              const lastRunDate = new Date(template.last_run.run_start_time);
              lastRunFormatted = lastRunDate.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              });
            }

            const createdDate = new Date(template.created_date);
            const createdAtFormatted = createdDate.toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            });

            const updatedDate = new Date(template.last_modified_date);
            const updatedAtFormatted = updatedDate.toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            });

            return {
              actions: '',
              name: template.template_name,
              description: template.template_description,
              prompt: template.prompt_text,
              status: template.template_status === 'ACTIVE' ? 'Active' : 'Draft',
              lastRun: lastRunFormatted,
              totalRuns: template.total_runs,
              owner: `${template.created_by.first_name} ${template.created_by.last_name}`,
              createdAt: createdAtFormatted,
              updatedAt: updatedAtFormatted,
            };
          });
          setTemplates(transformedTemplates);
        }
      } catch (error) {
        console.error('Error refreshing templates:', error);
      }
    };
    fetchData();
  };

  // Data Templates column definitions
  const templatesColumnDefs: ColDef[] = useMemo(() => [
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      filter: false,
      cellRenderer: (params: ICellRendererParams) => {
        const template = params.data as DataTemplate;
        
        const handleUploadClick = (e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          // Use setTimeout to allow dropdown to close first
          setTimeout(() => {
            handleUploadTemplate();
          }, 150);
        };
        
        const handleEditClick = (e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          // Use setTimeout to allow dropdown to close first
          setTimeout(() => {
            handleEditTemplate(template);
          }, 150);
        };
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="p-1 hover:bg-slate-100 rounded"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-4 h-4 text-[#606060]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="start"
              side="bottom"
              className="w-56"
              sideOffset={5}
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  handleUploadClick(e as any);
                }}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload New Template</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  handleEditClick(e as any);
                }}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Template</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' } as any,
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 1,
      minWidth: 120,
      sortable: true,
      filter: true,
      headerComponentParams: {
        menuIcon: 'faBars',
      },
    },
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 150,
      sortable: true,
      filter: true,
      headerComponentParams: {
        menuIcon: 'faBars',
      },
      cellRenderer: (params: ICellRendererParams) => (
        <a href="#" className="text-blue-600 underline hover:text-blue-800">
          {params.value}
        </a>
      ),
    },
    {
      field: 'prompt',
      headerName: 'Prompt',
      flex: 2,
      minWidth: 250,
      sortable: true,
      filter: true,
      headerComponentParams: {
        menuIcon: 'faBars',
      },
      cellStyle: { whiteSpace: 'normal', wordBreak: 'break-word' } as any,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      sortable: true,
      filter: true,
      headerComponentParams: {
        menuIcon: 'faBars',
      },
      cellRenderer: (params: ICellRendererParams) => {
        const status = params.value as string;
        const isActive = status === 'Active';
        return (
          <Badge
            className={
              isActive
                ? 'bg-green-500 text-white border-0'
                : 'bg-gray-200 text-slate-700 border-0'
            }
          >
            {status}
          </Badge>
        );
      },
    },
    {
      field: 'lastRun',
      headerName: 'Last Run',
      width: 200,
      sortable: true,
      filter: true,
      headerComponentParams: {
        menuIcon: 'faBars',
      },
      cellRenderer: (params: ICellRendererParams) => {
        if (!params.value) {
          return <span className="text-gray-400">-</span>;
        }
        return (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>{params.value}</span>
          </div>
        );
      },
    },
    {
      field: 'totalRuns',
      headerName: 'Total Runs',
      width: 120,
      sortable: true,
      filter: true,
      headerComponentParams: {
        menuIcon: 'faBars',
      },
      cellStyle: { textAlign: 'right', fontSize: '0.875rem' } as any,
      headerClass: 'text-sm',
    },
    {
      field: 'owner',
      headerName: 'Owner',
      width: 120,
      sortable: true,
      filter: true,
      headerComponentParams: {
        menuIcon: 'faBars',
      },
    },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 180,
      sortable: true,
      filter: true,
      headerComponentParams: {
        menuIcon: 'faBars',
      },
    },
    {
      field: 'updatedAt',
      headerName: 'Updated At',
      width: 180,
      sortable: true,
      filter: true,
      sort: 'desc',
      headerComponentParams: {
        menuIcon: 'faBars',
      },
    },
  ], []);

  // Runs column definitions
  const runsColumnDefs: ColDef[] = useMemo(() => [
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      filter: false,
      cellRenderer: (params: ICellRendererParams) => (
        <button className="p-1 hover:bg-slate-100 rounded">
          <Download className="w-4 h-4 text-[#606060]" />
        </button>
      ),
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' } as any,
    },
    {
      field: 'runId',
      headerName: 'Run ID',
      flex: 1,
      minWidth: 250,
      sortable: true,
      filter: true,
      headerComponentParams: {
        menuIcon: 'faBars',
      },
      cellStyle: { fontFamily: 'monospace', fontSize: '0.875rem' } as any,
    },
    {
      field: 'runAt',
      headerName: 'Run At',
      width: 180,
      sortable: true,
      filter: true,
      sort: 'desc',
      headerComponentParams: {
        menuIcon: 'faBars',
      },
      cellRenderer: (params: ICellRendererParams) => (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span>{params.value}</span>
        </div>
      ),
    },
    {
      field: 'runBy',
      headerName: 'Run By',
      width: 120,
      sortable: true,
      filter: true,
      headerComponentParams: {
        menuIcon: 'faBars',
      },
    },
    {
      field: 'parameters',
      headerName: 'Parameters',
      flex: 1,
      minWidth: 200,
      sortable: true,
      filter: true,
      headerComponentParams: {
        menuIcon: 'faBars',
      },
    },
    {
      field: 'templateName',
      headerName: 'Template Name',
      flex: 1,
      minWidth: 150,
      sortable: true,
      filter: true,
      headerComponentParams: {
        menuIcon: 'faBars',
      },
      cellRenderer: (params: ICellRendererParams) => (
        <a href="#" className="text-blue-600 underline hover:text-blue-800">
          {params.value}
        </a>
      ),
    },
    {
      field: 'prompt',
      headerName: 'Prompt',
      flex: 2,
      minWidth: 250,
      sortable: true,
      filter: true,
      headerComponentParams: {
        menuIcon: 'faBars',
      },
      cellStyle: { whiteSpace: 'normal', wordBreak: 'break-word' } as any,
    },
    {
      field: 'owner',
      headerName: 'Owner',
      width: 120,
      sortable: true,
      filter: true,
      headerComponentParams: {
        menuIcon: 'faBars',
      },
    },
  ], []);

  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
  }), []);

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch templates
      const templatesResponse = await fetch('/api/data-templates');
      if (!templatesResponse.ok) {
        throw new Error(`Failed to fetch templates: ${templatesResponse.statusText}`);
      }
      const templatesData = await templatesResponse.json();
      const transformedTemplates: DataTemplate[] = templatesData.data.map((template: ApiTemplate) => {
        // Format last run date
        let lastRunFormatted = null;
        if (template.last_run) {
          const lastRunDate = new Date(template.last_run.run_start_time);
          lastRunFormatted = lastRunDate.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          });
        }

        // Format created date
        const createdDate = new Date(template.created_date);
        const createdAtFormatted = createdDate.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

        // Format updated date
        const updatedDate = new Date(template.last_modified_date);
        const updatedAtFormatted = updatedDate.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

        return {
          actions: '',
          name: template.template_name,
          description: template.template_description,
          prompt: template.prompt_text,
          status: template.template_status === 'ACTIVE' ? 'Active' : 'Draft',
          lastRun: lastRunFormatted,
          totalRuns: template.total_runs,
          owner: `${template.created_by.first_name} ${template.created_by.last_name}`,
          createdAt: createdAtFormatted,
          updatedAt: updatedAtFormatted,
        };
      });
      setTemplates(transformedTemplates);

      // Fetch runs
      const runsResponse = await fetch('/api/data-templates/runs');
      if (!runsResponse.ok) {
        throw new Error(`Failed to fetch runs: ${runsResponse.statusText}`);
      }
      const runsData = await runsResponse.json();
      const transformedRuns: DataRun[] = runsData.runs.map((run: ApiRun) => {
        const date = new Date(run.start_time);
        const formattedDate = date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
        return {
          actions: '',
          runId: run.run_id,
          runAt: formattedDate,
          runBy: `${run.run_by.first_name} ${run.run_by.last_name}`,
          parameters: run.parameters,
          templateName: run.template_name,
          prompt: run.prompt_text,
          owner: `${run.run_by.first_name} ${run.run_by.last_name}`,
        };
      });
      setRuns(transformedRuns);
      setError(null);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white" style={{ height: '100%', minHeight: 0 }}>
      {/* Header with Breadcrumb and Title */}
      <header className="sticky top-0 z-10 bg-white  px-6 py-2 flex-shrink-0">
        <Breadcrumb activeRoute="home/workspace/data-template" className="mb-1.5" />
        <h1 className="text-2xl font-bold text-[#000000] mt-2">Data Template</h1>
      <div className="border-b border-[#B7B7B7] mt-4"></div></header>

      <div className="flex-1 overflow-auto">
        <div className="p-6 pt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-4 border border-gray-200 rounded-md bg-slate-50 px-4 flex-shrink-0 shadow-sm">
            <TabsList className="bg-transparent border-0 p-0 h-auto gap-0">
              <TabsTrigger
                value="templates"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:font-semibold rounded-none px-4 py-4 -mb-[1px] text-[#606060] hover:text-slate-900 border-b-2 border-transparent"
              >
                Data Templates
              </TabsTrigger>
              <TabsTrigger
                value="runs"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:font-semibold rounded-none px-4 py-4 -mb-[1px] text-[#606060] hover:text-slate-900 border-b-2 border-transparent"
              >
                Runs
              </TabsTrigger>
            </TabsList>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="flex items-center gap-2 bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>

          <TabsContent value="templates" className="mt-4 space-y-4">
           
            <div className="text-xs text-gray-500">
              Showing {templates.length} {templates.length === 1 ? 'template' : 'templates'}
            </div>
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="ag-theme-alpine w-full overflow-x-auto" style={{ height: 'calc(100vh - 380px)', width: '100%', minHeight: '350px' }}>
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-gray-500">Loading...</div>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-red-500">Error: {error}</div>
                  </div>
                ) : templates.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-gray-500">No templates found</div>
                  </div>
                ) : (
                  <AgGridReact
                    ref={templatesGridRef}
                    rowData={templates}
                    columnDefs={templatesColumnDefs}
                    defaultColDef={defaultColDef}
                    animateRows={true}
                    rowHeight={52}
                    headerHeight={48}
                    enableRangeSelection={false}
                    suppressMenuHide={true}
                    suppressCellFocus={true}
                    domLayout="normal"
                    className="ag-theme-alpine"
                    suppressHorizontalScroll={false}
                    getRowStyle={(params) => {
                      const rowIndex = params.node.rowIndex;
                      if (rowIndex !== null && rowIndex !== undefined && rowIndex % 2 === 0) {
                        return { backgroundColor: '#fafafa' };
                      }
                      return { backgroundColor: '#ffffff' };
                    }}
                    onFirstDataRendered={(params) => {
                      // Auto-size columns based on content
                      params.api.autoSizeColumns(['actions', 'description', 'name', 'prompt', 'status', 'lastRun', 'totalRuns', 'owner', 'createdAt', 'updatedAt']);
                    }}
                  />
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="runs" className="mt-4 space-y-4">
           
            <div className="text-xs text-gray-500">
              Showing {runs.length} {runs.length === 1 ? 'run' : 'runs'}
            </div>
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="ag-theme-alpine w-full overflow-x-auto" style={{ height: 'calc(100vh - 380px)', width: '100%', minHeight: '350px' }}>
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-gray-500">Loading...</div>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-red-500">Error: {error}</div>
                  </div>
                ) : runs.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-gray-500">No runs found</div>
                  </div>
                ) : (
                  <AgGridReact
                    ref={runsGridRef}
                    rowData={runs}
                    columnDefs={runsColumnDefs}
                    defaultColDef={defaultColDef}
                    animateRows={true}
                    rowHeight={52}
                    headerHeight={48}
                    enableRangeSelection={false}
                    suppressMenuHide={true}
                    suppressCellFocus={true}
                    domLayout="normal"
                    className="ag-theme-alpine"
                    suppressHorizontalScroll={false}
                    getRowStyle={(params) => {
                      const rowIndex = params.node.rowIndex;
                      if (rowIndex !== null && rowIndex !== undefined && rowIndex % 2 === 0) {
                        return { backgroundColor: '#fafafa' };
                      }
                      return { backgroundColor: '#ffffff' };
                    }}
                    onFirstDataRendered={(params) => {
                      // Auto-size columns based on content
                      params.api.autoSizeColumns(['actions', 'runId', 'runAt', 'runBy', 'parameters', 'templateName', 'prompt', 'owner']);
                    }}
                  />
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        </div>
      </div>

      {/* Modals */}
      {uploadModalOpen && (
        <UploadTemplateModal
          key="upload-modal"
          open={uploadModalOpen}
          onOpenChange={setUploadModalOpen}
          onSuccess={handleUploadSuccess}
        />
      )}
      {editModalOpen && (
        <EditTemplateModal
          key="edit-modal"
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          templateName={selectedTemplate?.name || ''}
          templateDescription={selectedTemplate?.description || ''}
          onSave={handleSaveTemplate}
        />
      )}
    </div>
  );
}
