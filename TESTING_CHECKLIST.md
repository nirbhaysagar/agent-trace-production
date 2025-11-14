# 🧪 AgentTrace - End-to-End Testing Checklist

**Status:** Database migration completed ✅  
**Date:** Testing in progress

---

## 📋 Pre-Testing Setup

### Environment Configuration
- [✅] **Backend Environment** ✅
  - [✅] Verify `backend/.env` exists (copy from `backend/env.example` if needed)
  - [✅] Set `SUPABASE_URL` to your Supabase project URL
  - [✅] Set `SUPABASE_ANON_KEY` to your Supabase anon key
  - [✅] Set `SUPABASE_SERVICE_ROLE_KEY` to your Supabase service role key (optional but recommended)
  - [✅] Verify `API_HOST=0.0.0.0` and `API_PORT=8000`

- [✅] **Frontend Environment** ✅
  - [✅] Verify `frontend/.env.local` exists (copy from `frontend/env.local.example` if needed)
  - [✅] Set `NEXT_PUBLIC_API_URL=http://localhost:8000` (or your backend URL)
  - [✅] Set `NEXT_PUBLIC_SUPABASE_URL` to your Supabase project URL
  - [✅] Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` to your Supabase anon key

### Server Startup
- [✅] **Start Backend Server** ✅
  ```bash
  cd backend
  pip install -r requirements.txt
  uvicorn main:app --reload
  ```
  - [✅] Verify backend is running at `http://localhost:8000`
  - [✅] Test health endpoint: `curl http://localhost:8000/health`
  - [✅] Verify response: `{"status": "healthy", "timestamp": "..."}`
  - ⚠️ **Issue Found:** Minor error in backend console (needs investigation)

- [✅] **Start Frontend Server** ✅
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
  - [✅] Verify frontend is running at `http://localhost:3000`
  - [✅] Open browser and check for errors in console

### Database Verification
- [✅] **Verify Database Tables** ✅
  - [✅] Open Supabase dashboard → SQL Editor
  - [✅] Run: `SELECT * FROM traces LIMIT 1;` (should return empty or existing traces)
  - [✅] Run: `SELECT * FROM saved_filters LIMIT 1;` (should return empty or existing filters)
  - [✅] Verify no errors in Supabase logs

---

## 🎭 Phase 1: Guest Mode Testing (No Authentication)

### 1.1 Homepage & Navigation
- [✅] **Visit Homepage** ✅
  - [✅] Navigate to `http://localhost:3000`
  - [✅] Verify page loads without errors
  - [✅] Check for guest mode warning/indicator (if present)
  - [✅] No guest mode errors
  - ⚠️ **Issue Found:** No sign-in option visible on top navigation (only "Traces" button visible)
  - **Note:** Sign-in buttons should appear in TopNav component when user is not authenticated

- [✅] **Navigation** ✅
  - [✅] Click "Dashboard" - verify it loads
  - [✅] Click "Traces" - verify it loads
  - [✅] Click "Upload" - verify it loads
  - [✅] Click "Compare" - verify it loads
  - [✅] Verify sidebar navigation works (desktop) or top nav (mobile)

### 1.2 Trace Upload (Guest Mode)

- [✅] **Upload via JSON Paste** ✅
  - [✅] Navigate to upload page
  - [✅] Use sample trace from `examples/sample-trace.json`
  - [✅] Copy JSON content and paste into text area
  - [✅] Enter trace name: "Test Guest Trace 1"
  - [✅] Enter description: "Testing guest mode upload"
  - [✅] Click "Upload Trace"
  - [ ] Verify success toast notification appears ⚠️ **Issue:** No notification appears after upload
  - [✅] Verify redirect to trace detail page
  - [✅] Note the trace ID from URL

- [✅] **Upload via File** ✅
  - [✅] Navigate to upload page
  - [✅] Click "Upload File" or file input
  - [✅] Select `examples/sample-trace.json`
  - [✅] Click "Upload"
  - [ ] Verify success notification ⚠️ **Issue:** No notification appears after upload
  - [✅] Verify redirect to trace detail page
  - [✅] Note the trace ID from URL
  - ⚠️ **UX Improvement Requested:** Add a "Process" button before redirecting to trace detail page (currently redirects immediately)

- [✅] **Upload Error Handling** ✅ (Partial)
  - [✅] Try uploading error JSON (`examples/error-trace.json`)
  - [✅] Verify error trace displays correctly with error steps highlighted
  - [ ] Try uploading invalid JSON (e.g., `{"invalid":}`)
  - [ ] Verify error message appears
  - [ ] Try uploading empty file
  - [ ] Verify appropriate error handling
  - ⚠️ **Issue:** Console error appears when uploading error JSON (needs investigation)

### 1.3 Trace Viewing (Guest Mode)

- [✅] **View Trace Details** ✅ (Partial)
  - [✅] Navigate to a trace detail page (use trace ID from upload)
  - [ ] Verify trace name and description are displayed ⚠️ **Issue:** Can't find title or description on trace detail page
  - [✅] Verify timeline shows all steps
  - [✅] Verify step count matches uploaded trace
  - [✅] Verify total duration is displayed
  - [✅] Verify total tokens is displayed (if available)
  - [✅] Verify error count is displayed
  - **Trace ID Role:** The trace ID in the URL (`/trace/{id}`) is used to:
    - Fetch the trace data from the backend API
    - Display the specific trace's details
    - Enable deep linking to specific traces
    - Allow sharing of traces via URL

- [✅] **Step Interaction** ✅
  - [✅] Click on a step in the timeline
  - [✅] Verify step details panel shows:
    - Step type (thought/action/observation/error)
    - Content
    - Timestamp
    - Duration (if available)
    - Tokens (if available)
    - Inputs/Outputs (if available)
  - [✅] Click different steps and verify details update
  - [✅] Test step bookmarking (if available)

- [ ] **Deep Linking**
  - [ ] Copy trace URL with step parameter: `/trace/{id}?step={step_id}`
  - [ ] Open in new tab/incognito
  - [ ] Verify page loads and scrolls to correct step
  - [ ] Verify step is highlighted/selected

### 1.4 Trace Filters (Guest Mode)

- [ ] **Filter by Step Type**
  - [ ] On trace detail page, open filters
  - [ ] Filter by "thought" - verify only thought steps shown
  - [ ] Filter by "action" - verify only action steps shown
  - [ ] Filter by "error" - verify only error steps shown
  - [ ] Clear filters - verify all steps shown

- [ ] **Filter by Date Range**
  - [ ] Set date range filter
  - [ ] Verify steps are filtered correctly
  - [ ] Clear date filter

- [ ] **Filter by Duration**
  - [ ] Set minimum duration filter
  - [ ] Verify only steps above threshold shown
  - [ ] Clear duration filter

### 1.5 Trace List (Guest Mode)

- [ ] **View Traces List**
  - [ ] Navigate to "Traces" page
  - [ ] Verify uploaded traces are listed
  - [ ] Verify trace names are displayed
  - [ ] Verify creation dates are displayed
  - [ ] Verify metadata (duration, tokens, errors) is shown

- [ ] **Pagination**
  - [ ] Upload multiple traces (at least 3)
  - [ ] Verify pagination controls appear (if > 50 traces)
  - [ ] Test next/previous page navigation
  - [ ] Verify traces load correctly on each page

### 1.6 Trace Comparison (Guest Mode)

- [ ] **Compare Two Traces**
  - [ ] Navigate to "Compare" page
  - [ ] Select first trace from dropdown
  - [ ] Select second trace from dropdown
  - [ ] Click "Compare"
  - [ ] Verify side-by-side comparison view loads
  - [ ] Verify steps are aligned by type
  - [ ] Verify duration differences are shown
  - [ ] Verify step counts are displayed

- [ ] **Compare Navigation**
  - [ ] Click on a step in comparison view
  - [ ] Verify step details are shown
  - [ ] Test switching between traces in comparison

### 1.7 Global Search (Guest Mode)

- [ ] **Search Functionality**
  - [ ] Use global search bar (if available in guest mode)
  - [ ] Search for text that exists in a trace
  - [ ] Verify search results appear
  - [ ] Click on a search result
  - [ ] Verify navigation to correct trace and step
  - [ ] Test search with no results
  - [ ] Verify appropriate "no results" message

### 1.8 Download & Share (Guest Mode)

- [✅] **Download Trace** ✅
  - [✅] On trace detail page, click "Download" button
  - [✅] Verify JSON file downloads
  - [✅] Open downloaded file
  - [✅] Verify JSON structure is correct
  - [✅] Verify all trace data is included

- [✅] **Shareable URLs** ✅ (Fixed)
  - [✅] Copy trace URL
  - [✅] Open in new incognito window
  - [✅] Verify trace loads correctly
  - [✅] Test with step parameter: `/trace/{id}?step={step_id}`
  - [✅] Verify step is highlighted
  - **Fix Applied:** Updated shareable URL generation to handle production URLs correctly

### 1.9 Dashboard (Guest Mode)

- [✅] **View Dashboard** ✅
  - [✅] Navigate to "Dashboard"
  - [✅] Verify charts are displayed:
    - Duration chart ✅
    - Tokens chart ✅
    - Errors chart ✅
    - Error rate chart ✅
  - [✅] Verify statistics are accurate (Total Traces, Total Tokens, Total Errors, Avg Duration, Error Rate) ✅
  - [✅] Verify recent traces are displayed in history section ✅
  - [✅] Verify graphs are working correctly ✅
  - [✅] Verify guest mode warning is shown (if applicable)

---

## 🔐 Phase 2: Authentication Testing

### 2.1 OAuth Setup Verification

- [ ] **Verify OAuth Configuration**
  - [ ] Check Supabase dashboard → Authentication → Providers
  - [ ] Verify Google OAuth is configured (if using)
  - [ ] Verify GitHub OAuth is configured (if using)
  - [ ] Verify redirect URLs are set correctly

### 2.2 Sign In Flow

- [ ] **Google Sign In** (if configured)
  - [ ] Click "Sign In" button
  - [ ] Click "Sign in with Google"
  - [ ] Complete OAuth flow
  - [ ] Verify redirect back to application
  - [ ] Verify user is signed in
  - [ ] Verify user avatar/email appears in top nav
  - [ ] Verify "Sign Out" button appears

- [ ] **GitHub Sign In** (if configured)
  - [ ] Sign out if signed in
  - [ ] Click "Sign In" button
  - [ ] Click "Sign in with GitHub"
  - [ ] Complete OAuth flow
  - [ ] Verify redirect back to application
  - [ ] Verify user is signed in
  - [ ] Verify user info appears in top nav

- [ ] **Auth Callback**
  - [ ] Manually navigate to `/auth/callback?code=test`
  - [ ] Verify error handling (invalid code)
  - [ ] Verify redirect to appropriate page

### 2.3 Sign Out Flow

- [ ] **Sign Out**
  - [ ] Click "Sign Out" button
  - [ ] Verify user is signed out
  - [ ] Verify redirect to home page
  - [ ] Verify "Sign In" button appears
  - [ ] Verify user data is cleared from session

---

## 👤 Phase 3: Authenticated Mode Testing

### 3.1 Trace Upload (Authenticated)

- [ ] **Upload as Authenticated User**
  - [ ] Sign in with OAuth
  - [ ] Navigate to upload page
  - [ ] Upload a trace with name: "Test Auth Trace 1"
  - [ ] Set description: "Testing authenticated upload"
  - [ ] Toggle "Public" checkbox ON
  - [ ] Click "Upload Trace"
  - [ ] Verify success notification
  - [ ] Verify trace is saved to database
  - [ ] Note the trace ID

- [ ] **Upload Private Trace**
  - [ ] Upload another trace
  - [ ] Leave "Public" checkbox OFF (private)
  - [ ] Verify trace is saved
  - [ ] Note the trace ID

- [ ] **Verify Trace Ownership**
  - [ ] Check trace in database (Supabase dashboard)
  - [ ] Verify `user_id` matches your user ID
  - [ ] Verify `is_public` flag is correct

### 3.2 Trace Viewing (Authenticated)

- [ ] **View Own Traces**
  - [ ] Navigate to "Traces" page
  - [ ] Verify your uploaded traces are listed
  - [ ] Click on a trace
  - [ ] Verify trace details load correctly
  - [ ] Verify you can see all steps

- [ ] **View Public Traces**
  - [ ] Sign out
  - [ ] Navigate to a public trace URL (from step 3.1)
  - [ ] Verify trace loads without authentication
  - [ ] Sign in with different account (if possible)
  - [ ] Navigate to same public trace
  - [ ] Verify trace is accessible

- [ ] **View Private Traces**
  - [ ] Sign in with account that owns private trace
  - [ ] Navigate to private trace URL
  - [ ] Verify trace loads
  - [ ] Sign out
  - [ ] Try to access private trace URL
  - [ ] Verify authentication is required
  - [ ] Sign in with different account
  - [ ] Try to access private trace URL
  - [ ] Verify 403 Forbidden or "Not authorized" message

### 3.3 Trace Visibility Toggle

- [ ] **Toggle Public/Private**
  - [ ] Sign in
  - [ ] Navigate to one of your traces
  - [ ] Find "Public/Private" toggle
  - [ ] Toggle from private to public
  - [ ] Verify success notification
  - [ ] Sign out
  - [ ] Verify trace is now accessible without auth
  - [ ] Sign in again
  - [ ] Toggle back to private
  - [ ] Verify trace is now private

### 3.4 Saved Filters (Authenticated)

- [ ] **Create Saved Filter**
  - [ ] Navigate to a trace detail page
  - [ ] Apply filters (e.g., step type: "error", duration > 100ms)
  - [ ] Click "Save Filter" or similar button
  - [ ] Enter filter name: "Error Steps Only"
  - [ ] Save filter
  - [ ] Verify success notification
  - [ ] Verify filter appears in saved filters list

- [ ] **Load Saved Filter**
  - [ ] Navigate to a different trace
  - [ ] Open saved filters dropdown
  - [ ] Select "Error Steps Only"
  - [ ] Verify filters are applied
  - [ ] Verify steps are filtered correctly

- [ ] **Delete Saved Filter**
  - [ ] Open saved filters list
  - [ ] Click delete on a saved filter
  - [ ] Verify confirmation dialog (if present)
  - [ ] Confirm deletion
  - [ ] Verify filter is removed from list
  - [ ] Verify filter is deleted from database

### 3.5 Global Search (Authenticated)

- [ ] **Search Own Traces**
  - [ ] Sign in
  - [ ] Use global search bar
  - [ ] Search for text in your traces
  - [ ] Verify search results show your traces only
  - [ ] Click on a search result
  - [ ] Verify navigation to correct trace and step

- [ ] **Search Edge Cases**
  - [ ] Search with very short query (< 2 chars)
  - [ ] Verify no results or appropriate message
  - [ ] Search with special characters
  - [ ] Verify search handles special chars correctly
  - [ ] Search with no matches
  - [ ] Verify "no results" message

### 3.6 Trace List (Authenticated)

- [ ] **View Own Traces**
  - [ ] Navigate to "Traces" page
  - [ ] Verify only your traces are listed
  - [ ] Verify public traces from other users are NOT listed
  - [ ] Verify trace metadata is correct

- [ ] **Pagination**
  - [ ] Upload multiple traces (if not already done)
  - [ ] Test pagination with your traces
  - [ ] Verify correct traces on each page

---

## 🔍 Phase 4: Advanced Features Testing

### 4.1 Error Trace Handling

- [ ] **Upload Error Trace**
  - [ ] Use `examples/error-trace.json` if available
  - [ ] Upload trace with errors
  - [ ] Verify error steps are highlighted
  - [ ] Verify error count is correct
  - [ ] Click on error step
  - [ ] Verify error message is displayed
  - [ ] Verify error details are shown

### 4.2 Large Trace Handling

- [ ] **Upload Large Trace**
  - [ ] Create or use a trace with 100+ steps
  - [ ] Upload trace
  - [ ] Verify upload succeeds
  - [ ] Verify trace loads without performance issues
  - [ ] Verify timeline renders correctly
  - [ ] Test scrolling through all steps
  - [ ] Test filtering on large trace

### 4.3 API Health Indicator

- [ ] **Check API Health**
  - [ ] Look for API health indicator in UI (top nav)
  - [ ] Verify it shows "Connected" or green status
  - [ ] Stop backend server
  - [ ] Verify health indicator shows "Disconnected" or red status
  - [ ] Click "Reconnect" button (if available)
  - [ ] Start backend server
  - [ ] Verify health indicator updates to "Connected"

### 4.4 Responsive Design

- [ ] **Mobile View**
  - [ ] Open browser dev tools
  - [ ] Switch to mobile view (375px width)
  - [ ] Verify sidebar collapses to top nav
  - [ ] Test all pages on mobile:
    - Homepage
    - Dashboard
    - Traces list
    - Trace detail
    - Upload
    - Compare
  - [ ] Verify all buttons/controls are accessible
  - [ ] Verify text is readable
  - [ ] Test touch interactions

- [ ] **Tablet View**
  - [ ] Test on tablet width (768px)
  - [ ] Verify layout adapts correctly
  - [ ] Verify navigation works

### 4.5 Browser Compatibility

- [ ] **Test in Multiple Browsers**
  - [ ] Chrome/Edge (Chromium)
  - [ ] Firefox
  - [ ] Safari (if on Mac)
  - [ ] Verify all features work in each browser

---

## 🐛 Phase 5: Error Handling & Edge Cases

### 5.1 Invalid Input Handling

- [ ] **Invalid JSON Upload**
  - [ ] Try uploading malformed JSON
  - [ ] Verify clear error message
  - [ ] Verify no crash occurs

- [ ] **Empty Trace**
  - [ ] Try uploading trace with no steps
  - [ ] Verify appropriate handling

- [ ] **Missing Required Fields**
  - [ ] Try uploading trace with missing step_type
  - [ ] Verify validation errors

### 5.2 Network Error Handling

- [ ] **Backend Offline**
  - [ ] Stop backend server
  - [ ] Try uploading a trace
  - [ ] Verify error message appears
  - [ ] Verify UI doesn't crash
  - [ ] Restart backend
  - [ ] Verify recovery works

- [ ] **Slow Network**
  - [ ] Use browser dev tools to throttle network
  - [ ] Test upload with slow 3G
  - [ ] Verify loading indicators appear
  - [ ] Verify timeout handling (if implemented)

### 5.3 Authentication Edge Cases

- [ ] **Expired Token**
  - [ ] Sign in
  - [ ] Manually expire token (if possible)
  - [ ] Try to access protected resource
  - [ ] Verify redirect to sign in or token refresh

- [ ] **Invalid Token**
  - [ ] Try accessing API with invalid token
  - [ ] Verify 401 error handling

### 5.4 Database Edge Cases

- [ ] **Database Connection Loss**
  - [ ] Disconnect from internet temporarily
  - [ ] Try to save trace
  - [ ] Verify fallback to in-memory storage (if implemented)
  - [ ] Reconnect
  - [ ] Verify data syncs (if implemented)

---

## 📊 Phase 6: Performance Testing

### 6.1 Load Testing

- [ ] **Multiple Traces**
  - [ ] Upload 10+ traces
  - [ ] Verify traces list loads quickly
  - [ ] Verify pagination works smoothly

- [ ] **Large Trace Rendering**
  - [ ] Upload trace with 500+ steps
  - [ ] Verify timeline renders in < 3 seconds
  - [ ] Verify scrolling is smooth
  - [ ] Verify filtering is responsive

### 6.2 API Response Times

- [ ] **Measure API Endpoints**
  - [ ] Health check: Should be < 100ms
  - [ ] Trace upload: Should be < 2s for normal traces
  - [ ] Trace retrieval: Should be < 500ms
  - [ ] Search: Should be < 1s

---

## ✅ Phase 7: Final Verification

### 7.1 Data Persistence

- [ ] **Verify Database Storage**
  - [ ] Sign in
  - [ ] Upload a trace
  - [ ] Check Supabase dashboard → Table Editor → traces
  - [ ] Verify trace is in database
  - [ ] Verify all fields are correct
  - [ ] Sign out and sign back in
  - [ ] Verify trace is still accessible

### 7.2 Guest Mode Persistence

- [ ] **Verify Guest Data**
  - [ ] Sign out
  - [ ] Upload trace in guest mode
  - [ ] Close browser tab
  - [ ] Reopen browser
  - [ ] Navigate to traces page
  - [ ] Verify guest trace is still accessible (from localStorage)
  - [ ] Clear browser data
  - [ ] Verify guest traces are cleared

### 7.3 Cross-Tab Behavior

- [ ] **Multiple Tabs**
  - [ ] Open application in two tabs
  - [ ] Sign in on tab 1
  - [ ] Verify tab 2 also shows signed in
  - [ ] Upload trace on tab 1
  - [ ] Refresh tab 2
  - [ ] Verify trace appears in tab 2

---

## 📝 Testing Notes

**Issues Found:**
- [✅] **Issue 1:** Minor error in backend console (needs investigation)
- [✅] **Issue 2:** No sign-in option visible on top navigation (only "Traces" button visible)
  - **Location:** TopNav component should show Google/GitHub sign-in buttons when user is not authenticated
  - **Status:** Needs investigation - may be hidden on mobile or layout issue
- [✅] **Issue 3:** No notification appears after trace upload ⚠️ **TO FIX**
  - **Expected:** Toast notification should appear (toast.success is called in TraceUploader component)
  - **Status:** Needs investigation - may be toast library not initialized or CSS issue
- [✅] **Issue 4:** No title/description displayed on trace detail page ⚠️ **TO FIX**
  - **Location:** `/trace/[id].tsx` - shows `trace.name || Trace ${trace.id.slice(0, 8)}`
  - **Expected:** Should display trace name and description if provided during upload
  - **Status:** Needs fix - trace name/description may not be passed correctly or not displayed prominently
- [✅] **Issue 5:** Automatic redirect after upload (UX improvement requested)
  - **Current:** Immediately redirects to trace detail page after upload
  - **Requested:** Add a "Process" button that processes the upload and then redirects
  - **Status:** Enhancement request
- [✅] **Issue 6:** Console error when uploading error JSON ⚠️ **TO FIX**
  - **Expected:** Error traces should be handled gracefully without console errors
  - **Status:** Needs investigation - check backend error handling for trace ingestion and frontend display of error traces

**Performance Observations:**
- [ ] Note any slow operations
- [ ] Note any memory issues
- [ ] Note any UI lag

**Browser-Specific Issues:**
- [ ] Chrome: [Notes]
- [ ] Firefox: [Notes]
- [ ] Safari: [Notes]

---

## 🎯 Testing Summary

**Date Completed:** In Progress

**Overall Status:**
- [✅] Some issues found (see notes above)
- [✅] Critical issues found (3 priority issues to fix)

**Completed So Far:**
- ✅ Pre-testing setup (environment, servers, database)
- ✅ Homepage loads correctly
- ✅ Navigation works
- ✅ Trace upload (JSON file and JSON paste) works
- ✅ Trace detail page loads and displays timeline
- ✅ Basic trace viewing works
- ✅ Step interaction (clicking steps to view details) works
- ✅ Dashboard displays recent traces, graphs, and stats correctly
- ✅ Error trace handling (error JSON upload and display)

**Issues to Fix:**
1. **Backend console error** - Investigate and fix
2. **Sign-in button not visible** - Check TopNav component rendering
3. **No notification after upload** ⚠️ **PRIORITY** - Check toast library initialization
4. **Missing title/description on trace detail page** ⚠️ **PRIORITY** - Fix display logic
5. **Console error with error JSON** ⚠️ **PRIORITY** - Fix error handling
6. **UX: Add "Process" button** - Implement before redirect (enhancement)

**Ready for Production:**
- [ ] No (blockers: Priority issues 3, 4, and 6 need to be resolved)

**Next Steps:**
1. **Fix Priority Issues:**
   - Fix notification after upload (Issue 3)
   - Fix missing title/description display (Issue 4)
   - Fix console error with error JSON (Issue 6)
2. **Continue Guest Mode Testing:**
   - Test filters (step type, date range, duration)
   - Test trace list
   - Test comparison
   - Test search
   - Test download & share
   - Test deep linking
3. **Fix Remaining Issues:**
   - Backend console error (Issue 1)
   - Sign-in button visibility (Issue 2)
4. **Complete OAuth Setup** (if not done)
5. **Test Authenticated Mode**
6. **Test Advanced Features & Edge Cases**

---

**Happy Testing! 🕵️‍♂️**

