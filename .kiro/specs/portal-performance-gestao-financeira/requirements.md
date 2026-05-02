# Requirements Document

## Introduction

This document specifies the requirements for a dual-module web application that integrates with ClickUp API to provide:
1. **Performance Portal**: A client-facing dashboard displaying social media post metrics in real-time
2. **Financial Management**: An internal cash flow control system for agency financial operations

The system follows a Backend-for-Frontend (BFF) architecture pattern where all ClickUp API interactions are handled server-side through Next.js API Routes, ensuring security and proper access control through multi-tenant client_id isolation.

## Glossary

- **Portal**: The web application system containing both Performance and Financial modules
- **Client**: An agency customer who has access to view their performance metrics
- **User**: An authenticated person accessing the Portal (can be a Client or internal staff)
- **BFF**: Backend-for-Frontend layer implemented as Next.js API Routes
- **ClickUp_API**: External ClickUp REST API used as the data source
- **Post**: A social media content item represented as a ClickUp task with custom fields
- **Transaction**: A financial entry (income or expense) represented as a ClickUp task
- **Custom_Field**: ClickUp task metadata fields storing structured data
- **Client_ID**: Unique identifier linking Users to their specific ClickUp lists
- **JWT_Token**: JSON Web Token used for authentication and authorization
- **Multi_Tenant**: Architecture pattern where each Client accesses only their isolated data
- **Performance_Module**: The client-facing dashboard for post metrics
- **Financial_Module**: The internal cash flow management dashboard
- **Parcelamento**: Installment payment split across multiple periods (e.g., "3/10" means installment 3 of 10)
- **Faturamento_Bruto**: Gross revenue (sum of all income entries)
- **Faturamento_Líquido**: Net revenue (gross revenue minus taxes and fees)
- **Saldo_Atual**: Current balance (paid income minus paid expenses)

## Requirements

### Requirement 1: User Authentication

**User Story:** As a User, I want to authenticate with email and password, so that I can securely access the Portal with proper authorization.

#### Acceptance Criteria

1. WHEN a User submits valid credentials, THE Authentication_Service SHALL generate a JWT_Token containing the Client_ID
2. WHEN a User submits invalid credentials, THE Authentication_Service SHALL return an error message and deny access
3. THE Authentication_Service SHALL integrate with Supabase Auth for credential validation
4. WHEN a JWT_Token is generated, THE Authentication_Service SHALL include an expiration timestamp
5. THE Portal SHALL redirect authenticated Users to the dashboard selection screen

### Requirement 2: Multi-Tenant Access Control

**User Story:** As a Client, I want to access only my own data, so that my information remains private and secure.

#### Acceptance Criteria

1. WHEN a User makes an API request, THE BFF SHALL extract the Client_ID from the JWT_Token
2. WHEN querying ClickUp_API, THE BFF SHALL filter results to include only data associated with the authenticated Client_ID
3. IF a User attempts to access data for a different Client_ID, THEN THE BFF SHALL return a 403 Forbidden error
4. THE BFF SHALL validate the JWT_Token signature before processing any request
5. IF a JWT_Token is expired or invalid, THEN THE BFF SHALL return a 401 Unauthorized error

### Requirement 3: Performance Module Data Retrieval

**User Story:** As a Client, I want to view my social media post metrics, so that I can track content performance without accessing ClickUp directly.

#### Acceptance Criteria

1. WHEN a Client requests performance data, THE BFF SHALL call the ClickUp_API to retrieve tasks from the Client's performance list
2. THE BFF SHALL extract Custom_Fields from each task including: Alcance, Engajamento, Impressões, Cliques, Status, and Imagem
3. THE BFF SHALL transform ClickUp task data into a normalized Post object structure
4. WHEN the ClickUp_API returns data, THE BFF SHALL return a JSON array of Post objects to the frontend within 2 seconds
5. IF the ClickUp_API call fails, THEN THE BFF SHALL log the error and return a user-friendly error message

### Requirement 4: Performance Module Display

**User Story:** As a Client, I want to see my posts displayed as visual cards, so that I can quickly understand performance at a glance.

#### Acceptance Criteria

1. THE Performance_Module SHALL render each Post as a card containing: thumbnail image, status badge, and metric values
2. THE Performance_Module SHALL display the following metrics for each Post: Alcance, Engajamento, Impressões, and Cliques
3. WHEN a Post has no image, THE Performance_Module SHALL display a placeholder thumbnail
4. THE Performance_Module SHALL use visual indicators to distinguish between post statuses (Publicado, Agendado, etc.)
5. THE Performance_Module SHALL render the dashboard in a responsive layout compatible with mobile and desktop viewports

### Requirement 5: Performance Module Time Filtering

**User Story:** As a Client, I want to filter posts by time period, so that I can analyze performance trends over specific intervals.

#### Acceptance Criteria

1. THE Performance_Module SHALL provide filter options for: current week and current month
2. WHEN a Client selects a time filter, THE Performance_Module SHALL request filtered data from the BFF with period parameters
3. THE BFF SHALL filter Post data based on the task creation date or custom date field matching the requested period
4. WHEN a filter is applied, THE Performance_Module SHALL update the displayed cards within 2 seconds
5. THE Performance_Module SHALL persist the selected filter in the UI state during the session

### Requirement 6: Financial Module Data Retrieval

**User Story:** As an internal User, I want to retrieve financial transaction data from ClickUp, so that I can manage the agency's cash flow.

#### Acceptance Criteria

1. WHEN a User requests financial data, THE BFF SHALL call the ClickUp_API to retrieve tasks from the financial list
2. THE BFF SHALL extract Custom_Fields from each task including: Valor, Tipo, Status, Data_de_Vencimento, Impostos_Taxas, and Parcelamento
3. THE BFF SHALL transform ClickUp task data into a normalized Transaction object structure
4. THE BFF SHALL return a JSON array of Transaction objects to the frontend
5. IF the ClickUp_API call fails, THEN THE BFF SHALL log the error and return a user-friendly error message

### Requirement 7: Financial Calculations

**User Story:** As an internal User, I want to see calculated financial summaries, so that I can understand the agency's financial health.

#### Acceptance Criteria

1. THE Financial_Module SHALL calculate Faturamento_Bruto as the sum of all Transaction objects where Tipo equals "Entrada" within the selected period
2. THE Financial_Module SHALL calculate Faturamento_Líquido as Faturamento_Bruto minus the sum of Impostos_Taxas for all income transactions
3. THE Financial_Module SHALL calculate Saldo_Atual as the sum of paid income transactions minus the sum of paid expense transactions
4. WHEN displaying calculations, THE Financial_Module SHALL format currency values with proper locale formatting (BRL)
5. THE Financial_Module SHALL recalculate all values when the transaction list or period filter changes

### Requirement 8: Financial Transaction Status Visualization

**User Story:** As an internal User, I want to see visual indicators for transaction status, so that I can quickly identify overdue or pending payments.

#### Acceptance Criteria

1. WHEN a Transaction has Status "Atrasado", THE Financial_Module SHALL display a red indicator
2. WHEN a Transaction has Status "Pendente", THE Financial_Module SHALL display a yellow indicator
3. WHEN a Transaction has Status "Pago", THE Financial_Module SHALL display a green indicator
4. THE Financial_Module SHALL sort transactions by Data_de_Vencimento in ascending order by default
5. THE Financial_Module SHALL highlight transactions where Data_de_Vencimento equals today's date

### Requirement 9: Cash Flow Projection

**User Story:** As an internal User, I want to see future transactions, so that I can forecast cash flow and plan accordingly.

#### Acceptance Criteria

1. THE Financial_Module SHALL identify future transactions where Data_de_Vencimento is greater than today's date
2. THE Financial_Module SHALL calculate projected income as the sum of future transactions where Tipo equals "Entrada"
3. THE Financial_Module SHALL calculate projected expenses as the sum of future transactions where Tipo equals "Saída"
4. THE Financial_Module SHALL display projected income and expenses in separate summary cards
5. THE Financial_Module SHALL include both "Pendente" and "Atrasado" status transactions in projections

### Requirement 10: Installment Payment Processing

**User Story:** As an internal User, I want to track installment payments, so that I can manage multi-month payment schedules.

#### Acceptance Criteria

1. WHEN a Transaction contains a Parcelamento value (e.g., "3/10"), THE Financial_Module SHALL parse the current installment number and total installments
2. THE Financial_Module SHALL display the installment information alongside the transaction (e.g., "Parcela 3 de 10")
3. THE Financial_Module SHALL calculate the per-installment value by dividing Valor by the total number of installments
4. WHEN displaying future projections, THE Financial_Module SHALL distribute remaining installments across future months
5. THE Financial_Module SHALL treat each installment as a separate entry in cash flow projections

### Requirement 11: Transaction Creation

**User Story:** As an internal User, I want to create new financial transactions, so that I can record income and expenses in the system.

#### Acceptance Criteria

1. THE Financial_Module SHALL provide a form with fields for: Valor, Tipo, Data_de_Vencimento, Status, Impostos_Taxas, and Parcelamento
2. WHEN a User submits the form, THE Financial_Module SHALL send a POST request to the BFF with the transaction data
3. THE BFF SHALL validate that required fields (Valor, Tipo, Data_de_Vencimento, Status) are present
4. THE BFF SHALL call the ClickUp_API to create a new task with the provided data as Custom_Fields
5. WHEN the task is created successfully, THE BFF SHALL return a success response and THE Financial_Module SHALL refresh the transaction list

### Requirement 12: API Security

**User Story:** As a system administrator, I want the ClickUp API key to be secured, so that unauthorized users cannot access or misuse it.

#### Acceptance Criteria

1. THE BFF SHALL store the ClickUp_API key in environment variables on the server
2. THE Portal SHALL NOT expose the ClickUp_API key in client-side code or network responses
3. THE BFF SHALL include the ClickUp_API key in the Authorization header when calling ClickUp_API
4. THE Portal SHALL NOT allow direct client-side calls to ClickUp_API
5. THE BFF SHALL validate all incoming requests contain a valid JWT_Token before proxying to ClickUp_API

### Requirement 13: Performance Optimization

**User Story:** As a User, I want the Portal to load quickly, so that I can access information without delays.

#### Acceptance Criteria

1. WHEN a User navigates to a dashboard, THE Portal SHALL display initial content within 2 seconds on a standard broadband connection
2. THE Portal SHALL implement data caching using React Query or SWR with a 5-minute stale time
3. WHEN cached data exists, THE Portal SHALL display cached data immediately while revalidating in the background
4. THE BFF SHALL implement response compression for JSON payloads larger than 1KB
5. THE Portal SHALL use Next.js Image component for optimized image loading with lazy loading enabled

### Requirement 14: Responsive Design

**User Story:** As a User, I want to access the Portal on any device, so that I can view data on mobile, tablet, or desktop.

#### Acceptance Criteria

1. THE Portal SHALL render correctly on viewport widths from 320px to 2560px
2. WHEN viewed on mobile devices (< 768px width), THE Portal SHALL stack cards vertically and adjust font sizes for readability
3. WHEN viewed on tablet devices (768px - 1024px width), THE Portal SHALL display cards in a 2-column grid layout
4. WHEN viewed on desktop devices (> 1024px width), THE Portal SHALL display cards in a 3-column or 4-column grid layout
5. THE Portal SHALL use TailwindCSS responsive utility classes for all layout breakpoints

### Requirement 15: Error Handling

**User Story:** As a User, I want to see helpful error messages when something goes wrong, so that I understand what happened and what to do next.

#### Acceptance Criteria

1. WHEN the ClickUp_API returns an error, THE BFF SHALL log the full error details server-side
2. WHEN the ClickUp_API returns an error, THE BFF SHALL return a user-friendly error message to the frontend without exposing internal details
3. WHEN a network request fails, THE Portal SHALL display an error notification with a retry option
4. WHEN authentication fails, THE Portal SHALL display a specific message indicating invalid credentials
5. WHEN the ClickUp_API is unavailable, THE Portal SHALL display a message indicating the service is temporarily unavailable

### Requirement 16: Module Navigation

**User Story:** As a User, I want to switch between Performance and Financial modules, so that I can access different areas of the Portal.

#### Acceptance Criteria

1. WHEN a User is authenticated, THE Portal SHALL display a navigation menu with options for Performance_Module and Financial_Module
2. WHEN a User selects a module, THE Portal SHALL navigate to the corresponding dashboard route
3. THE Portal SHALL highlight the currently active module in the navigation menu
4. THE Portal SHALL preserve authentication state when navigating between modules
5. THE Portal SHALL use Next.js App Router for client-side navigation without full page reloads

### Requirement 17: Data Normalization

**User Story:** As a developer, I want ClickUp data to be normalized in the BFF, so that the frontend receives consistent, predictable data structures.

#### Acceptance Criteria

1. THE BFF SHALL transform ClickUp task objects into domain-specific objects (Post or Transaction)
2. THE BFF SHALL map Custom_Field IDs to human-readable property names
3. THE BFF SHALL handle missing Custom_Fields by providing default values (0 for numbers, empty string for text, null for optional fields)
4. THE BFF SHALL convert ClickUp date formats to ISO 8601 format
5. THE BFF SHALL remove unnecessary ClickUp metadata fields before sending responses to the frontend

### Requirement 18: Modular Architecture

**User Story:** As a developer, I want the codebase to be modular, so that new features can be added without affecting existing functionality.

#### Acceptance Criteria

1. THE Portal SHALL organize code into separate directories: /modules/performance, /modules/finance, and /services/clickup
2. THE Portal SHALL implement a ClickUp service module that encapsulates all ClickUp_API interactions
3. THE Portal SHALL define TypeScript interfaces for Post and Transaction domain objects
4. THE Portal SHALL separate business logic (calculations, transformations) from UI components
5. THE Portal SHALL use dependency injection or service patterns to allow easy testing and extension

### Requirement 19: Configuration Management

**User Story:** As a developer, I want configuration to be externalized, so that the application can be deployed to different environments without code changes.

#### Acceptance Criteria

1. THE Portal SHALL read the ClickUp_API key from environment variables
2. THE Portal SHALL read the Supabase configuration (URL, anon key) from environment variables
3. THE Portal SHALL provide a .env.example file documenting all required environment variables
4. THE Portal SHALL validate that required environment variables are present at application startup
5. IF required environment variables are missing, THEN THE Portal SHALL log an error and fail to start

### Requirement 20: Extensibility for Future Metrics

**User Story:** As a product owner, I want to add new metrics without changing frontend code, so that the system can evolve with business needs.

#### Acceptance Criteria

1. THE BFF SHALL dynamically map all Custom_Fields from ClickUp tasks to the response object
2. WHEN new Custom_Fields are added in ClickUp, THE BFF SHALL include them in the response without code changes
3. THE Performance_Module SHALL render metric fields dynamically based on the data structure received from the BFF
4. THE Portal SHALL provide a configuration file or admin interface to control which metrics are displayed
5. THE Portal SHALL handle unknown or new metric types gracefully without breaking existing functionality
