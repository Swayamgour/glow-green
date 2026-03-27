// src/services/api.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Base URLs from your original services





// 

// Helper to get token
const getToken = () => localStorage.getItem('gg_token');
// let url = ''

// const BASE_URL = VITE_API_URL || "https://glowgreen-backend.onrender.com/api";

// Base query with authentication
const baseQuery = fetchBaseQuery({

    // baseUrl: 'http://localhost:5000',
    baseUrl: 'https://glow-green.onrender.com',
    prepareHeaders: (headers) => {
        const token = getToken();

        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }

        // Don't set Content-Type for FormData (will be set automatically)
        // For regular JSON requests, we'll set it in the individual queries
        return headers;
    },
});

// Custom base query to handle 401 responses
const baseQueryWithReauth = async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);

    // Token expired or invalid — force logout
    if (result.error && result.error.status === 401) {
        localStorage.removeItem('gg_token');
        localStorage.removeItem('gg_user');
        window.location.href = '/';
    }

    return result;
};

export const api = createApi({
    reducerPath: "api",
    baseQuery: baseQueryWithReauth,
    tagTypes: [
        "Auth",
        "Users",
        "Leads",
        "Customers",
        "Products",
        "Quotations",
        "TDS",
        "Executives",
        "Reports",
        "MOM"
    ],
    endpoints: (builder) => ({

        // ================= AUTH ENDPOINTS =================
        login: builder.mutation({
            query: (credentials) => ({
                url: "/api/auth/login",
                method: "POST",
                body: credentials,
                headers: { 'Content-Type': 'application/json' }
            }),
            transformResponse: (response) => {
                if (response.success && response.data) {
                    // Save session data
                    localStorage.setItem('gg_token', response.data.token);
                    localStorage.setItem('gg_user', JSON.stringify({
                        _id: response.data._id,
                        name: response.data.name,
                        email: response.data.email,
                        role: response.data.role
                    }));
                    return response.data;
                }
                throw new Error(response.message);
            },
            invalidatesTags: ["Auth"]
        }),

        register: builder.mutation({
            query: (userData) => ({
                url: "/api/auth/register",
                method: "POST",
                body: userData,
                headers: { 'Content-Type': 'application/json' }
            }),
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            }
        }),

        getMe: builder.query({
            query: () => "/api/auth/me",
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            providesTags: ["Auth"]
        }),

        getAuthUsers: builder.query({
            query: () => "/api/auth/users",
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            providesTags: ["Users"]
        }),

        toggleAuthUser: builder.mutation({
            query: (id) => ({
                url: `/api/auth/users/${id}/toggle`,
                method: "PATCH",
            }),
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            invalidatesTags: ["Users"]
        }),

        seedAdmin: builder.mutation({
            query: () => ({
                url: "/api/auth/seed",
                method: "POST",
            }),
            transformResponse: (response) => response
        }),

        // ================= CUSTOMERS ENDPOINTS =================
        getCustomers: builder.query({
            query: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return `/api/customers${queryString ? `?${queryString}` : ''}`;
            },
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            providesTags: ["Customers"]
        }),

        getCustomerById: builder.query({
            query: (id) => `/api/customers/${id}`,
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            providesTags: (result, error, id) => [{ type: "Customers", id }]
        }),

        createCustomer: builder.mutation({
            query: (body) => ({
                url: "/api/customers",
                method: "POST",
                body,
                headers: { 'Content-Type': 'application/json' }
            }),
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            invalidatesTags: ["Customers"]
        }),

        updateCustomer: builder.mutation({
            query: ({ id, ...body }) => ({
                url: `/api/customers/${id}`,
                method: "PUT",
                body,
                headers: { 'Content-Type': 'application/json' }
            }),
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            invalidatesTags: (result, error, { id }) => [{ type: "Customers", id }]
        }),

        deleteCustomer: builder.mutation({
            query: (id) => ({
                url: `/api/customers/${id}`,
                method: "DELETE",
            }),
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            invalidatesTags: ["Customers"]
        }),

        addCustomerNote: builder.mutation({
            query: ({ id, text }) => ({
                url: `/api/customers/${id}/notes`,
                method: "POST",
                body: { text },
                headers: { 'Content-Type': 'application/json' }
            }),
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            invalidatesTags: (result, error, { id }) => [{ type: "Customers", id }]
        }),



        exportCustomersExcel: builder.query({
            query: (params = {}) => ({
                url: "/api/customers/export",
                params,
                responseHandler: (response) => response.blob(), // ✅ FIX
            }),
            transformResponse: (response) => response,
        }),

        downloadCustomerTemplate: builder.query({
            query: () => ({
                url: "/api/customers/template",
                responseHandler: (response) => response.blob(), // ✅ FIX
            }),
            transformResponse: (response) => response,
        }),

        importCustomersExcel: builder.mutation({
            query: (file) => {
                const formData = new FormData();
                formData.append('file', file);
                return {
                    url: "/api/customers/import",
                    method: "POST",
                    body: formData,
                };
            },
            transformResponse: (response) => response,
            invalidatesTags: ["Customers"]
        }),

        // ================= EXECUTIVES ENDPOINTS =================
        getExecutives: builder.query({
            query: () => "/api/executives",
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            providesTags: ["Executives"]
        }),

        getExecutiveById: builder.query({
            query: (id) => `/api/executives/${id}`,
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            providesTags: (result, error, id) => [{ type: "Executives", id }]
        }),

        viewExecutivePassword: builder.query({
            query: (id) => `/api/executives/${id}/view-password`,
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response;
            },
        }),

        createExecutive: builder.mutation({
            query: (formData) => ({
                url: "/api/executives",
                method: "POST",
                body: formData,
            }),
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            invalidatesTags: ["Executives"]
        }),

        updateExecutive: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/api/executives/${id}`,
                method: "PUT",
                body: data,
                headers: { 'Content-Type': 'application/json' }
            }),
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            invalidatesTags: (result, error, { id }) => [{ type: "Executives", id }]
        }),

        deleteExecutive: builder.mutation({
            query: (id) => ({
                url: `/api/executives/${id}`,
                method: "DELETE",
            }),
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            invalidatesTags: ["Executives"]
        }),

        updateExecutivePassword: builder.mutation({
            query: ({ id, password }) => ({
                url: `/api/executives/${id}/password`, // ✅ correct
                method: "PATCH",
                body: { password },
            }),
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
        }),





        // ================= LEADS ENDPOINTS =================
        getLeads: builder.query({
            query: (filters = {}) => {
                const params = new URLSearchParams(filters).toString();
                return `/api/leads${params ? `?${params}` : ''}`;
            },
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            providesTags: ["Leads"]
        }),

        getLeadById: builder.query({
            query: (id) => `/api/leads/${id}`,
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            providesTags: (result, error, id) => [{ type: "Leads", id }]
        }),

        createLead: builder.mutation({
            query: (body) => ({
                url: "/api/leads",
                method: "POST",
                body,
                headers: { 'Content-Type': 'application/json' }
            }),
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            invalidatesTags: ["Leads"]
        }),

        updateLead: builder.mutation({
            query: ({ id, ...body }) => ({
                url: `/api/leads/${id}`,
                method: "PUT",
                body,
                headers: { 'Content-Type': 'application/json' }
            }),
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            invalidatesTags: (result, error, { id }) => [{ type: "Leads", id }]
        }),

        deleteLead: builder.mutation({
            query: (id) => ({
                url: `/api/leads/${id}`,
                method: "DELETE",
            }),
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            invalidatesTags: ["Leads"]
        }),

        updateLeadStatus: builder.mutation({
            query: ({ id, status }) => ({
                url: `/api/leads/${id}/status`,
                method: "PATCH",
                body: { status, leadStatus: status },
                headers: { 'Content-Type': 'application/json' }
            }),
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            invalidatesTags: (result, error, { id }) => [{ type: "Leads", id }]
        }),

        updateLeadCategory: builder.mutation({
            query: ({ id, category }) => ({
                url: `/api/leads/${id}/category`,
                method: "PATCH",
                body: { category },
                headers: { 'Content-Type': 'application/json' }
            }),
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            invalidatesTags: (result, error, { id }) => [{ type: "Leads", id }]
        }),

        updateLeadField: builder.mutation({
            query: ({ id, field, value }) => ({
                url: `/api/leads/${id}`,
                method: "PATCH",
                body: { [field]: value },
                headers: { 'Content-Type': 'application/json' }
            }),
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            invalidatesTags: (result, error, { id }) => [{ type: "Leads", id }]
        }),

        addLeadNote: builder.mutation({
            query: ({ id, text }) => ({
                url: `/api/leads/${id}/notes`,
                method: "POST",
                body: { text },
                headers: { 'Content-Type': 'application/json' }
            }),
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            invalidatesTags: (result, error, { id }) => [{ type: "Leads", id }]
        }),

        deleteLeadNote: builder.mutation({
            query: ({ id, noteId }) => ({
                url: `/api/leads/${id}/notes/${noteId}`,
                method: "DELETE",
            }),
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            invalidatesTags: (result, error, { id }) => [{ type: "Leads", id }]
        }),

        // ================= PRODUCTS ENDPOINTS =================
        getProducts: builder.query({
            query: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return `/api/products${queryString ? `?${queryString}` : ''}`;
            },
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            providesTags: ["Products"]
        }),

        getProductById: builder.query({
            query: (id) => `/api/products/${id}`,
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            providesTags: (result, error, id) => [{ type: "Products", id }]
        }),

        createProduct: builder.mutation({
            query: (body) => ({
                url: "/api/products",
                method: "POST",
                body,
                headers: { 'Content-Type': 'application/json' }
            }),
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            invalidatesTags: ["Products"]
        }),

        updateProduct: builder.mutation({
            query: ({ id, ...body }) => ({
                url: `/api/products/${id}`,
                method: "PUT",
                body,
                headers: { 'Content-Type': 'application/json' }
            }),
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            invalidatesTags: (result, error, { id }) => [{ type: "Products", id }]
        }),

        deleteProduct: builder.mutation({
            query: (id) => ({
                url: `/api/products/${id}`,
                method: "DELETE",
            }),
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            invalidatesTags: ["Products"]
        }),

        exportProductsExcel: builder.query({
            query: (type = '') => ({
                url: `/api/products/export${type ? `?type=${type}` : ''}`,
                responseHandler: (response) => response.blob(), // ✅ FIX
            }),
        }),

        downloadProductTemplate: builder.query({
            query: (type = '') => ({
                url: `/api/products/template${type ? `?type=${type}` : ''}`,
                responseHandler: (response) => response.blob(), // ✅ FIX
            }),
        }),

        importProductsExcel: builder.mutation({
            query: ({ file, type }) => {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('type', type);
                return {
                    url: "/api/products/import",
                    method: "POST",
                    body: formData,
                };
            },
            transformResponse: (response) => response,
            invalidatesTags: ["Products"]
        }),

        // ================= QUOTATIONS ENDPOINTS =================
        getQuotations: builder.query({
            query: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return `/api/quotations${queryString ? `?${queryString}` : ''}`;
            },
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            providesTags: ["Quotations"]
        }),

        getQuotationById: builder.query({
            query: (id) => `/api/quotations/${id}`,
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            providesTags: (result, error, id) => [{ type: "Quotations", id }]
        }),

        createQuotation: builder.mutation({
            query: (body) => ({
                url: "/api/quotations",
                method: "POST",
                body,
                headers: { 'Content-Type': 'application/json' }
            }),
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            invalidatesTags: ["Quotations"]
        }),

        updateQuotation: builder.mutation({
            query: ({ id, ...body }) => ({
                url: `/api/quotations/${id}`,
                method: "PUT",
                body,
                headers: { 'Content-Type': 'application/json' }
            }),
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            invalidatesTags: (result, error, { id }) => [{ type: "Quotations", id }]
        }),

        deleteQuotation: builder.mutation({
            query: (id) => ({
                url: `/api/quotations/${id}`,
                method: "DELETE",
            }),
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            invalidatesTags: ["Quotations"]
        }),

        updateQuotationStatus: builder.mutation({
            query: ({ id, status }) => ({
                url: `/api/quotations/${id}/status`,
                method: "PATCH",
                body: { status },
                headers: { 'Content-Type': 'application/json' }
            }),
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            invalidatesTags: (result, error, { id }) => [{ type: "Quotations", id }]
        }),

        downloadQuotationPDF: builder.query({
            query: (id) => ({
                url: `/api/quotations/${id}/pdf`,
            }),
            transformResponse: (response) => {
                if (response.pdfUrl) return response.pdfUrl;
                throw new Error("PDF URL not found");
            },
        }),

        // ================= TDS ENDPOINTS =================
        getTDSList: builder.query({
            query: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return `/api/tds${queryString ? `?${queryString}` : ''}`;
            },
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            providesTags: ["TDS"]
        }),

        getTDSById: builder.query({
            query: (id) => `/api/tds/${id}`,
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            providesTags: (result, error, id) => [{ type: "TDS", id }]
        }),

        getTDSCategories: builder.query({
            query: () => "/api/tds/categories",
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            providesTags: ["TDS"]
        }),

        uploadTDS: builder.mutation({
            query: (formData) => ({
                url: "/api/tds",
                method: "POST",
                body: formData,
            }),
            transformResponse: (response) => response,
            invalidatesTags: ["TDS"]
        }),

        updateTDS: builder.mutation({
            query: ({ id, ...body }) => ({
                url: `/api/tds/${id}`,
                method: "PUT",
                body,
                headers: { 'Content-Type': 'application/json' }
            }),
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            invalidatesTags: (result, error, { id }) => [{ type: "TDS", id }]
        }),

        deleteTDS: builder.mutation({
            query: (id) => ({
                url: `/api/tds/${id}`,
                method: "DELETE",
            }),
            transformResponse: (response) => {
                if (!response.success) throw new Error(response.message);
                return response.data;
            },
            invalidatesTags: ["TDS"]
        }),

        // downloadTDS: builder.query({
        //     query: (id) => ({
        //         url: `/api/tds/${id}/download`,
        //         responseHandler: "blob",
        //     }),
        //     transformResponse: (response) => response,
        // }),

        downloadTDS: builder.query({
            query: (id) => ({
                url: `/api/tds/${id}/download`,
                responseHandler: (response) => response.blob(), // ✅ FIX
            }),
        }),

        // ================= MOM (Minutes of Meeting) ENDPOINTS =================
        scanAndGenerateMOM: builder.mutation({
            query: (imageFile) => {
                const formData = new FormData();
                formData.append('image', imageFile);
                return {
                    url: "/api/mom/scan-and-generate",
                    method: "POST",
                    body: formData,
                };
            },
            transformResponse: async (response) => {
                const text = await response.text();
                if (!text || text.trim() === '') {
                    throw new Error(`Server returned empty response`);
                }
                return JSON.parse(text);
            },
            invalidatesTags: ["MOM"]
        }),

        generateMOMFromText: builder.mutation({
            query: (text) => ({
                url: "/api/mom/generate-from-text",
                method: "POST",
                body: { text },
                headers: { 'Content-Type': 'application/json' }
            }),
            transformResponse: async (response) => {
                const text = await response.text();
                if (!text || text.trim() === '') {
                    throw new Error(`Server returned empty response`);
                }
                return JSON.parse(text);
            },
            invalidatesTags: ["MOM"]
        }),

        // ================= REPORTS ENDPOINTS =================
        exportLeadsReport: builder.query({
            query: (params = {}) => ({
                url: "/api/reports/leads",
                params,
                // responseHandler: "blob",
                responseHandler: (response) => response.blob(), // ✅ FIX

            }),
            transformResponse: (response) => response,
            providesTags: ["Reports"]
        }),

        exportCustomersReport: builder.query({
            query: (params = {}) => ({
                url: "/api/reports/customers",
                params,
                // responseHandler: "blob",
                responseHandler: (response) => response.blob(), // ✅ FIX

            }),
            transformResponse: (response) => response,
            providesTags: ["Reports"]
        }),

        exportProductsReport: builder.query({
            query: (params = {}) => ({
                url: "/api/reports/products",
                params,
                // responseHandler: "blob",
                responseHandler: (response) => response.blob(), // ✅ FIX

            }),
            transformResponse: (response) => response,
            providesTags: ["Reports"]
        }),

        exportQuotationsReport: builder.query({
            query: (params = {}) => ({
                url: "/api/reports/quotations",
                params,
                // responseHandler: "blob",
                responseHandler: (response) => response.blob(), // ✅ FIX

            }),
            transformResponse: (response) => response,
            providesTags: ["Reports"]
        }),

        exportMasterReport: builder.query({
            query: (params = {}) => ({
                url: "/api/reports/master",
                params,
                // responseHandler: "blob",
                responseHandler: (response) => response.blob(), // ✅ FIX

            }),
            transformResponse: (response) => response,
            providesTags: ["Reports"]
        }),
    }),
});

// Export hooks for all endpoints
export const {
    // Auth
    useLoginMutation,
    useRegisterMutation,
    useGetMeQuery,
    useGetAuthUsersQuery,
    useToggleAuthUserMutation,
    useSeedAdminMutation,

    // Customers
    useGetCustomersQuery,
    useGetCustomerByIdQuery,
    useCreateCustomerMutation,
    useUpdateCustomerMutation,
    useDeleteCustomerMutation,
    useAddCustomerNoteMutation,
    useLazyExportCustomersExcelQuery,
    useLazyDownloadCustomerTemplateQuery,
    useImportCustomersExcelMutation,
    // useLazyExportCustomersExcelQuery,

    // Executives
    useGetExecutivesQuery,
    useGetExecutiveByIdQuery,
    useCreateExecutiveMutation,
    useUpdateExecutiveMutation,
    useDeleteExecutiveMutation,
    useUpdateExecutivePasswordMutation,
    useLazyViewExecutivePasswordQuery,

    // Leads
    useGetLeadsQuery,
    useGetLeadByIdQuery,
    useCreateLeadMutation,
    useUpdateLeadMutation,
    useDeleteLeadMutation,
    useUpdateLeadStatusMutation,
    useUpdateLeadCategoryMutation,
    useUpdateLeadFieldMutation,
    useAddLeadNoteMutation,
    useDeleteLeadNoteMutation,
    // useAddLeadNoteMutation,

    // Products
    useGetProductsQuery,
    useGetProductByIdQuery,
    useCreateProductMutation,
    useUpdateProductMutation,
    useDeleteProductMutation,
    useLazyExportProductsExcelQuery,
    useLazyDownloadProductTemplateQuery,
    useImportProductsExcelMutation,

    // Quotations
    useGetQuotationsQuery,
    useGetQuotationByIdQuery,
    useCreateQuotationMutation,
    useUpdateQuotationMutation,
    useDeleteQuotationMutation,
    useUpdateQuotationStatusMutation,
    useDownloadQuotationPDFQuery,

    // TDS
    useGetTDSListQuery,
    useGetTDSByIdQuery,
    useGetTDSCategoriesQuery,
    useUploadTDSMutation,
    useUpdateTDSMutation,
    useDeleteTDSMutation,
    useLazyDownloadTDSQuery,

    // MOM
    useScanAndGenerateMOMMutation,
    useGenerateMOMFromTextMutation,

    // Reports
    useLazyExportLeadsReportQuery,
    useLazyExportCustomersReportQuery,
    useLazyExportProductsReportQuery,
    useLazyExportQuotationsReportQuery,
    useLazyExportMasterReportQuery,
} = api;

export default api;