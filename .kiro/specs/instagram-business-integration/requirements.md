# Requirements Document: Instagram Business Integration

## Introduction

This document specifies the requirements for integrating Instagram Business API directly into the ALUA Produtora system to automate social media performance tracking and task creation in ClickUp. The integration enables automatic retrieval of Instagram post metrics, creation of ClickUp tasks, and display of performance data in the ALUA dashboard without relying on third-party automation platforms like Make.com or Zapier.

The system supports multiple Instagram Business accounts (up to 3 different admins), each with their own Instagram Business profile, and synchronizes data in near real-time with the existing ClickUp integration and Performance dashboard.

## Glossary

- **Instagram_Business_API**: Meta's official REST API for accessing Instagram Business account data
- **Instagram_Business_Account**: A business-type Instagram account with access to insights and metrics
- **Admin**: An internal user with permission to manage Instagram Business account integrations
- **Post**: A content item published on Instagram, represented as a ClickUp task with metrics
- **Metrics**: Performance data for a post including Alcance, Engajamento, Impressões, Cliques, Likes, Comments
- **Alcance**: Number of unique users who saw the post (reach)
- **Engajamento**: Total interactions (likes, comments, shares) on the post
- **Impressões**: Total number of times the post was displayed
- **Cliques**: Number of clicks on the post
- **Likes**: Number of likes on the post
- **Comments**: Number of comments on the post
- **Access_Token**: Instagram Business API authentication token with required permissions
- **Credential_Storage**: Secure server-side storage for Instagram API credentials
- **Sync_Job**: Automated background process that fetches Instagram data and creates ClickUp tasks
- **Sync_Frequency**: Time interval between automatic data synchronization attempts
- **Real_Time_Sync**: Synchronization occurring within 5 minutes of post publication
- **Multi_Account_Support**: System capability to manage multiple Instagram Business accounts simultaneously
- **Account_Mapping**: Association between Instagram Business account and ClickUp list for task creation
- **Webhook**: HTTP callback mechanism for receiving Instagram events (future enhancement)
- **BFF**: Backend-for-Frontend layer (existing Next.js API Routes)
- **ClickUp_API**: Existing ClickUp integration for task creation
- **Performance_Dashboard**: Existing ALUA dashboard displaying post metrics

## Requirements

### Requirement 1: Instagram Business Account Configuration

**User Story:** As an Admin, I want to configure Instagram Business accounts in the system, so that the system can access multiple Instagram profiles and their metrics.

#### Acceptance Criteria

1. WHEN an Admin accesses the configuration interface, THE System SHALL display a form to add Instagram Business account credentials
2. THE System SHALL require the following inputs: Instagram_Business_Account_ID, Access_Token, and Account_Name
3. WHEN an Admin submits valid credentials, THE System SHALL validate the Access_Token by making a test API call to Instagram_Business_API
4. IF the Access_Token is invalid or expired, THEN THE System SHALL return an error message and prevent account configuration
5. WHEN credentials are validated successfully, THE System SHALL store them securely in Credential_Storage (encrypted environment variables or secure vault)
6. THE System SHALL NOT expose Access_Tokens in frontend code, logs, or API responses
7. WHEN an Admin configures an account, THE System SHALL create an Account_Mapping linking the Instagram_Business_Account to a ClickUp list
8. THE System SHALL support configuration of up to 3 Instagram Business accounts simultaneously

### Requirement 2: Instagram Business Account Validation

**User Story:** As a system administrator, I want to validate Instagram Business account credentials, so that only authorized accounts can be integrated.

#### Acceptance Criteria

1. WHEN credentials are submitted, THE System SHALL call Instagram_Business_API with the provided Access_Token
2. THE System SHALL verify that the Access_Token has required permissions: instagram_business_content_read, instagram_business_insights_read
3. IF required permissions are missing, THEN THE System SHALL return an error indicating insufficient permissions
4. THE System SHALL retrieve the Instagram_Business_Account name and profile picture to confirm account access
5. WHEN validation succeeds, THE System SHALL store the account configuration with a timestamp
6. THE System SHALL implement credential validation with a timeout of 10 seconds
7. IF validation fails, THEN THE System SHALL log the failure reason for debugging purposes

### Requirement 3: Automatic Post Retrieval from Instagram

**User Story:** As an Admin, I want the system to automatically fetch published posts from Instagram, so that post data is available without manual intervention.

#### Acceptance Criteria

1. WHEN a Sync_Job is triggered, THE System SHALL call Instagram_Business_API to retrieve recent posts from each configured Instagram_Business_Account
2. THE System SHALL retrieve posts published within the last 24 hours (or since the last successful sync)
3. THE System SHALL extract the following data for each post: post_id, caption, media_type, media_url, timestamp, and permalink
4. WHEN posts are retrieved, THE System SHALL store them temporarily in memory or cache for metric retrieval
5. THE System SHALL handle pagination if Instagram_Business_API returns more than 25 posts
6. IF Instagram_Business_API returns an error, THEN THE System SHALL log the error and retry the request with exponential backoff (max 3 retries)
7. THE System SHALL complete post retrieval within 30 seconds per account

### Requirement 4: Automatic Metrics Retrieval from Instagram

**User Story:** As an Admin, I want the system to automatically fetch post metrics from Instagram, so that performance data is current and accurate.

#### Acceptance Criteria

1. WHEN a Sync_Job retrieves posts, THE System SHALL call Instagram_Business_API to fetch metrics for each post
2. THE System SHALL retrieve the following metrics for each post: Alcance, Engajamento, Impressões, Cliques, Likes, Comments
3. THE System SHALL map Instagram API metric names to ALUA metric names (e.g., "reach" → "Alcance")
4. WHEN metrics are retrieved, THE System SHALL validate that all metric values are non-negative numbers
5. IF a metric is unavailable (null or missing), THE System SHALL use a default value of 0
6. THE System SHALL retrieve metrics with a maximum age of 1 hour (Instagram insights have a 1-hour delay)
7. THE System SHALL complete metrics retrieval within 60 seconds for all posts from one account

### Requirement 5: Real-Time Synchronization

**User Story:** As an Admin, I want posts to be synchronized in near real-time, so that the dashboard displays current performance data.

#### Acceptance Criteria

1. THE System SHALL implement a Sync_Job that runs automatically at regular intervals (Sync_Frequency = 5 minutes)
2. WHEN a Sync_Job runs, THE System SHALL fetch posts and metrics from all configured Instagram_Business_Accounts
3. THE System SHALL complete a full sync cycle (all accounts, all posts, all metrics) within 120 seconds
4. IF a sync cycle exceeds 120 seconds, THEN THE System SHALL log a warning and continue processing
5. THE System SHALL implement exponential backoff for failed sync attempts (5 min, 10 min, 20 min, then stop)
6. WHEN a sync succeeds, THE System SHALL reset the backoff counter
7. THE System SHALL store the timestamp of the last successful sync for each account
8. THE System SHALL provide an Admin interface to manually trigger a sync job on demand

### Requirement 6: ClickUp Task Creation from Instagram Posts

**User Story:** As an Admin, I want the system to automatically create ClickUp tasks for Instagram posts, so that post data is integrated with the existing task management system.

#### Acceptance Criteria

1. WHEN a post is retrieved from Instagram, THE System SHALL create a corresponding ClickUp task in the designated ClickUp list
2. THE System SHALL map Instagram post data to ClickUp task fields: title (from caption), description (from post details), and custom fields (metrics)
3. THE System SHALL create custom fields in ClickUp for: Alcance, Engajamento, Impressões, Cliques, Likes, Comments, Instagram_Post_ID, Instagram_Account_Name
4. WHEN a task is created, THE System SHALL store the mapping between Instagram_Post_ID and ClickUp_Task_ID for future updates
5. IF a task already exists for an Instagram post (based on Instagram_Post_ID), THE System SHALL update the existing task with new metrics instead of creating a duplicate
6. THE System SHALL include the Instagram post permalink in the ClickUp task description for easy access
7. THE System SHALL set the ClickUp task status to "Publicado" (Published) for published posts
8. THE System SHALL complete task creation/update within 10 seconds per post

### Requirement 7: Metrics Update in ClickUp

**User Story:** As an Admin, I want post metrics to be updated in ClickUp automatically, so that task data stays current with Instagram performance.

#### Acceptance Criteria

1. WHEN a Sync_Job retrieves updated metrics from Instagram, THE System SHALL update the corresponding ClickUp task custom fields
2. THE System SHALL update the following custom fields: Alcance, Engajamento, Impressões, Cliques, Likes, Comments
3. WHEN metrics are updated, THE System SHALL preserve the task's existing status, description, and other fields
4. THE System SHALL only update metrics if they have changed since the last sync (to reduce API calls)
5. IF a ClickUp API call fails, THEN THE System SHALL log the error and retry the update in the next sync cycle
6. THE System SHALL track the timestamp of the last metric update for each task
7. THE System SHALL complete metrics updates within 60 seconds for all posts from one account

### Requirement 8: Multi-Account Support

**User Story:** As an Admin, I want to manage multiple Instagram Business accounts, so that different team members' accounts can be tracked simultaneously.

#### Acceptance Criteria

1. THE System SHALL support configuration and synchronization of up to 3 Instagram Business accounts
2. WHEN a Sync_Job runs, THE System SHALL process all configured accounts in parallel (or sequential with proper timeout handling)
3. WHEN processing multiple accounts, THE System SHALL isolate data so that posts from one account do not appear in another account's ClickUp list
4. THE System SHALL maintain separate Account_Mappings for each Instagram_Business_Account
5. WHEN an account is removed, THE System SHALL delete its credentials and Account_Mapping
6. THE System SHALL display the status of each account (active, inactive, last sync time) in the Admin interface
7. THE System SHALL allow Admins to enable/disable individual accounts without removing their configuration

### Requirement 9: Credential Security

**User Story:** As a system administrator, I want Instagram credentials to be secured, so that unauthorized users cannot access or misuse them.

#### Acceptance Criteria

1. THE System SHALL store Access_Tokens in encrypted environment variables or a secure credential vault (not in database or code)
2. THE System SHALL NOT expose Access_Tokens in frontend code, API responses, or logs
3. THE System SHALL implement server-side credential retrieval only (no client-side access to credentials)
4. THE System SHALL rotate Access_Tokens automatically if Instagram_Business_API provides refresh tokens
5. WHEN an Access_Token expires, THE System SHALL log an error and pause sync for that account until credentials are updated
6. THE System SHALL implement audit logging for all credential access and modifications
7. THE System SHALL require Admin authentication for viewing or modifying account credentials

### Requirement 10: Error Handling and Resilience

**User Story:** As an Admin, I want the system to handle errors gracefully, so that temporary API failures do not disrupt the integration.

#### Acceptance Criteria

1. WHEN Instagram_Business_API returns an error, THE System SHALL log the error with full context (account, timestamp, error code)
2. THE System SHALL implement exponential backoff for failed API calls (1s, 2s, 4s, 8s, max 60s)
3. IF an API call fails after 3 retries, THEN THE System SHALL skip that operation and continue with the next post/account
4. WHEN a sync cycle fails, THE System SHALL store the failure reason and display it in the Admin interface
5. THE System SHALL implement circuit breaker pattern to prevent cascading failures (stop retrying after 5 consecutive failures)
6. WHEN the circuit breaker is triggered, THE System SHALL send an alert to Admins
7. THE System SHALL provide a manual retry mechanism in the Admin interface to recover from failures

### Requirement 11: Sync Job Scheduling

**User Story:** As a system administrator, I want sync jobs to run automatically, so that data stays current without manual intervention.

#### Acceptance Criteria

1. THE System SHALL implement a background job scheduler (using Node.js cron, AWS Lambda, or similar)
2. THE System SHALL run Sync_Jobs at regular intervals (Sync_Frequency = 5 minutes by default)
3. THE System SHALL allow Admins to configure Sync_Frequency (minimum 5 minutes, maximum 60 minutes)
4. WHEN a Sync_Job is scheduled, THE System SHALL prevent overlapping executions (only one sync per account at a time)
5. THE System SHALL log the start and end time of each Sync_Job
6. WHEN a Sync_Job completes, THE System SHALL update the "last sync time" for each account
7. THE System SHALL provide an Admin interface to view sync job history and status

### Requirement 12: Dashboard Integration

**User Story:** As a Client, I want to see Instagram posts in the Performance dashboard, so that I can view all social media performance in one place.

#### Acceptance Criteria

1. WHEN a Client views the Performance dashboard, THE System SHALL display posts retrieved from Instagram alongside existing posts
2. THE System SHALL display Instagram posts with the same card layout as existing posts (title, image, metrics, status)
3. THE System SHALL include a visual indicator (badge or label) showing that a post is from Instagram
4. THE System SHALL display all metrics: Alcance, Engajamento, Impressões, Cliques, Likes, Comments
5. WHEN a Client filters by time period, THE System SHALL include Instagram posts in the filtered results
6. THE System SHALL sort Instagram posts by publication date alongside other posts
7. THE System SHALL display the Instagram account name for each post (to distinguish between multiple accounts)

### Requirement 13: Account Mapping Configuration

**User Story:** As an Admin, I want to map Instagram accounts to ClickUp lists, so that posts are created in the correct location.

#### Acceptance Criteria

1. WHEN an Admin configures an Instagram_Business_Account, THE System SHALL display a list of available ClickUp lists
2. THE System SHALL allow the Admin to select which ClickUp list to use for task creation
3. WHEN an Account_Mapping is created, THE System SHALL store the relationship between Instagram_Business_Account and ClickUp_List
4. THE System SHALL validate that the selected ClickUp list exists and is accessible
5. IF the ClickUp list is deleted, THE System SHALL disable the Account_Mapping and alert the Admin
6. THE System SHALL allow Admins to change the Account_Mapping at any time
7. WHEN an Account_Mapping is changed, THE System SHALL apply it to future posts (not retroactively)

### Requirement 14: Post Deduplication

**User Story:** As a system administrator, I want to prevent duplicate posts, so that the same Instagram post is not created multiple times in ClickUp.

#### Acceptance Criteria

1. WHEN a post is retrieved from Instagram, THE System SHALL check if a ClickUp task already exists for that Instagram_Post_ID
2. IF a task exists, THE System SHALL update the existing task with new metrics instead of creating a new task
3. THE System SHALL use Instagram_Post_ID as the unique identifier for deduplication
4. WHEN checking for duplicates, THE System SHALL query the ClickUp custom field "Instagram_Post_ID"
5. IF a duplicate is detected, THE System SHALL log the event and skip task creation
6. THE System SHALL handle edge cases where the Instagram_Post_ID custom field is missing or corrupted

### Requirement 15: Metrics Validation

**User Story:** As a system administrator, I want to validate metrics data, so that incorrect or corrupted data does not appear in the dashboard.

#### Acceptance Criteria

1. WHEN metrics are retrieved from Instagram_Business_API, THE System SHALL validate that all values are non-negative numbers
2. IF a metric value is negative or invalid, THE System SHALL replace it with 0 and log a warning
3. THE System SHALL validate that Engajamento (engagement) is less than or equal to Impressões (impressions)
4. IF this relationship is violated, THE System SHALL log a warning but still store the data
5. THE System SHALL validate that Likes and Comments are less than or equal to Engajamento
6. IF this relationship is violated, THE System SHALL log a warning but still store the data
7. THE System SHALL implement data type validation (all metrics must be integers)

### Requirement 16: Admin Interface for Account Management

**User Story:** As an Admin, I want a user interface to manage Instagram accounts, so that I can configure and monitor integrations without technical knowledge.

#### Acceptance Criteria

1. THE System SHALL provide an Admin interface accessible only to authenticated Admins
2. THE Admin interface SHALL display a list of configured Instagram_Business_Accounts with status (active/inactive)
3. THE Admin interface SHALL display the last sync time and next scheduled sync time for each account
4. THE Admin interface SHALL provide buttons to: add account, edit account, delete account, and manually trigger sync
5. WHEN an Admin adds an account, THE System SHALL display a form with fields for: Account_Name, Instagram_Business_Account_ID, Access_Token
6. WHEN an Admin deletes an account, THE System SHALL require confirmation and display a warning about data loss
7. THE Admin interface SHALL display sync job history with timestamps and status (success/failure)
8. THE Admin interface SHALL display error messages and alerts for failed syncs

### Requirement 17: Logging and Monitoring

**User Story:** As a system administrator, I want to monitor the integration, so that I can detect and troubleshoot issues quickly.

#### Acceptance Criteria

1. THE System SHALL log all API calls to Instagram_Business_API with: timestamp, account, endpoint, status code, response time
2. THE System SHALL log all ClickUp task creation/update operations with: timestamp, post_id, task_id, status
3. THE System SHALL log all errors with: timestamp, error type, error message, account, and context
4. THE System SHALL implement structured logging (JSON format) for easy parsing and analysis
5. THE System SHALL retain logs for at least 30 days
6. THE System SHALL provide a log viewer in the Admin interface to search and filter logs
7. THE System SHALL implement alerting for critical errors (e.g., credential expiration, repeated API failures)

### Requirement 18: Performance Optimization

**User Story:** As a system administrator, I want the integration to be efficient, so that it does not consume excessive resources or slow down the system.

#### Acceptance Criteria

1. THE System SHALL cache Instagram post data for 5 minutes to reduce API calls
2. THE System SHALL implement batch processing for metric updates (update multiple tasks in a single ClickUp API call if possible)
3. THE System SHALL limit concurrent API calls to Instagram_Business_API (max 5 concurrent requests)
4. THE System SHALL implement request timeouts (30 seconds for Instagram API, 10 seconds for ClickUp API)
5. THE System SHALL monitor API response times and log warnings if response times exceed thresholds
6. THE System SHALL implement database indexing on Instagram_Post_ID and Account_ID for fast lookups
7. THE System SHALL optimize database queries to minimize the number of database round-trips

### Requirement 19: Data Consistency

**User Story:** As a system administrator, I want data to be consistent, so that the dashboard displays accurate information.

#### Acceptance Criteria

1. WHEN a post is created in ClickUp, THE System SHALL store the Instagram_Post_ID in a custom field for future reference
2. WHEN metrics are updated, THE System SHALL use transactions to ensure all fields are updated atomically
3. IF a partial update fails, THE System SHALL rollback the entire operation and retry in the next sync cycle
4. THE System SHALL implement reconciliation logic to detect and fix inconsistencies between Instagram and ClickUp
5. WHEN an inconsistency is detected, THE System SHALL log the issue and alert Admins
6. THE System SHALL provide a manual reconciliation tool in the Admin interface to fix inconsistencies

### Requirement 20: Future Webhook Support

**User Story:** As a product owner, I want to support webhooks in the future, so that the system can receive real-time notifications from Instagram.

#### Acceptance Criteria

1. THE System architecture SHALL be designed to support webhooks without major refactoring
2. THE System SHALL implement a webhook endpoint (POST /api/instagram/webhooks) that can receive Instagram events
3. THE System SHALL validate webhook signatures using Instagram's webhook signature verification
4. WHEN a webhook is received, THE System SHALL trigger an immediate sync for the affected post
5. THE System SHALL implement webhook retry logic (Instagram will retry failed webhooks)
6. THE System SHALL log all webhook events for debugging and monitoring
7. THE System SHALL provide a configuration interface for enabling/disabling webhooks per account

