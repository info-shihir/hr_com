-- Create Employees Table
CREATE TABLE employees (
    emp_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    department TEXT,
    role TEXT,
    email TEXT,
    join_date DATE,
    employment_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Compliance Matrix Table
CREATE TABLE compliance_matrix (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department TEXT,
    role TEXT,
    document_type TEXT NOT NULL,
    validity_period INTEGER,
    criticality TEXT DEFAULT 'Medium',
    category TEXT,
    applies_to TEXT DEFAULT 'All',
    employee_id TEXT REFERENCES employees(emp_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Document Inventory Table
CREATE TABLE document_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT REFERENCES employees(emp_id),
    doc_type TEXT NOT NULL,
    upload_date DATE,
    expiry_date DATE,
    doc_status TEXT DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Policy Acknowledgements Table
CREATE TABLE policy_acknowledgements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT REFERENCES employees(emp_id),
    policy_name TEXT NOT NULL,
    acknowledged_date DATE,
    version TEXT DEFAULT '1.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Audit Log Table
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    employee_id TEXT,
    employee_name TEXT,
    compliance_score INTEGER,
    risk_level TEXT,
    total_gaps INTEGER,
    high_criticality_gaps INTEGER,
    report_generated TEXT,
    notifications_sent TEXT,
    report_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert Sample Data for testing
INSERT INTO employees (emp_id, name, department, role, email, join_date, employment_type) VALUES
('EMP001', 'John Doe', 'Engineering', 'Software Engineer', 'john.doe@example.com', '2023-01-15', 'Full-time'),
('EMP002', 'Jane Smith', 'HR', 'HR Manager', 'jane.smith@example.com', '2022-11-20', 'Full-time');

INSERT INTO compliance_matrix (department, role, document_type, validity_period, criticality, category, applies_to) VALUES
('All', 'All', 'Employment Contract', 0, 'High', 'Onboarding', 'All'),
('All', 'All', 'ID Proof', 60, 'High', 'Legal', 'All'),
('Engineering', 'All', 'Security Clearance', 24, 'High', 'Legal', 'All'),
('HR', 'All', 'Privacy Certification', 12, 'Medium', 'Legal', 'All');

INSERT INTO document_inventory (employee_id, doc_type, upload_date, expiry_date, doc_status) VALUES
('EMP001', 'Employment Contract', '2023-01-16', NULL, 'Active'),
('EMP001', 'ID Proof', '2023-01-16', '2028-01-16', 'Active'),
('EMP002', 'Employment Contract', '2022-11-21', NULL, 'Active');

INSERT INTO policy_acknowledgements (employee_id, policy_name, acknowledged_date, version) VALUES
('EMP001', 'Code of Conduct', '2023-01-17', '1.0'),
('EMP001', 'Data Privacy Policy', '2023-01-17', '1.0'),
('EMP002', 'Code of Conduct', '2022-11-22', '1.0');

-- Enable Row Level Security (RLS)
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_acknowledgements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Create Policies to allow public access (Demo/Testing mode)
CREATE POLICY "Allow public access" ON employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON compliance_matrix FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON document_inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON policy_acknowledgements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON audit_log FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for all tables
-- Note: This requires the 'supabase_realtime' publication to exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE 
        employees, 
        compliance_matrix, 
        document_inventory, 
        policy_acknowledgements, 
        audit_log;
  END IF;
END $$;
