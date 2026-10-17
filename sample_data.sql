-- ============================================================
-- sample_data.sql : test data (all names and numbers are made up)
-- Run AFTER tables.sql, triggers.sql and procedures.sql.
-- Run only once. Running twice fails on the unique email column.
-- ============================================================

-- Hospitals
INSERT INTO hospital (name, city, state, phone, has_transplant_unit) VALUES ('CMC Vellore', 'Vellore', 'Tamil Nadu', '0416-0000001', 'Y');
INSERT INTO hospital (name, city, state, phone, has_transplant_unit) VALUES ('JIPMER', 'Puducherry', 'Puducherry', '0413-0000002', 'Y');
INSERT INTO hospital (name, city, state, phone, has_transplant_unit) VALUES ('Apollo Hospitals', 'Chennai', 'Tamil Nadu', '044-00000003', 'Y');
INSERT INTO hospital (name, city, state, phone, has_transplant_unit) VALUES ('Kurnool Government General Hospital', 'Kurnool', 'Andhra Pradesh', '08518-000004', 'N');
INSERT INTO hospital (name, city, state, phone, has_transplant_unit) VALUES ('Care Hospitals', 'Hyderabad', 'Telangana', '040-00000005', 'Y');

-- Donors (Suresh Kumar is marked unavailable on purpose)
INSERT INTO donor (full_name, dob, gender, blood_group, phone, email, city) VALUES ('Arjun Reddy',     DATE '1999-03-14', 'M', 'O-',  '9000000001', 'arjun.reddy@example.com',   'Kurnool');
INSERT INTO donor (full_name, dob, gender, blood_group, phone, email, city) VALUES ('Priya Sharma',    DATE '1995-07-22', 'F', 'A+',  '9000000002', 'priya.sharma@example.com',  'Vellore');
INSERT INTO donor (full_name, dob, gender, blood_group, phone, email, city) VALUES ('Karthik Raman',   DATE '1990-11-05', 'M', 'B+',  '9000000003', 'karthik.raman@example.com', 'Chennai');
INSERT INTO donor (full_name, dob, gender, blood_group, phone, email, city) VALUES ('Sneha Iyer',      DATE '2000-01-30', 'F', 'O+',  '9000000004', 'sneha.iyer@example.com',    'Puducherry');
INSERT INTO donor (full_name, dob, gender, blood_group, phone, email, city) VALUES ('Rahul Verma',     DATE '1988-09-18', 'M', 'AB+', '9000000005', 'rahul.verma@example.com',   'Hyderabad');
INSERT INTO donor (full_name, dob, gender, blood_group, phone, email, city) VALUES ('Divya Nair',      DATE '1997-05-09', 'F', 'A-',  '9000000006', 'divya.nair@example.com',    'Chennai');
INSERT INTO donor (full_name, dob, gender, blood_group, phone, email, city) VALUES ('Mohammed Faizan', DATE '1993-12-27', 'M', 'B-',  '9000000007', 'faizan.m@example.com',      'Kurnool');
INSERT INTO donor (full_name, dob, gender, blood_group, phone, email, city) VALUES ('Lakshmi Devi',    DATE '1985-02-11', 'F', 'O+',  '9000000008', 'lakshmi.devi@example.com',  'Vellore');
INSERT INTO donor (full_name, dob, gender, blood_group, phone, email, city, is_available) VALUES ('Suresh Kumar', DATE '1992-08-03', 'M', 'A+', '9000000009', 'suresh.kumar@example.com', 'Puducherry', 'N');
INSERT INTO donor (full_name, dob, gender, blood_group, phone, email, city) VALUES ('Anitha Rao',      DATE '2001-06-15', 'F', 'AB-', '9000000010', 'anitha.rao@example.com',    'Hyderabad');

-- Organ pledges
INSERT INTO donor_organ (donor_id, organ_id)
SELECT d.donor_id, o.organ_id
FROM donor d, organ_type o
WHERE (d.full_name, o.organ_name) IN (
    ('Arjun Reddy',  'Kidney'),
    ('Arjun Reddy',  'Cornea'),
    ('Priya Sharma', 'Kidney'),
    ('Priya Sharma', 'Liver'),
    ('Karthik Raman','Cornea'),
    ('Sneha Iyer',   'Kidney'),
    ('Rahul Verma',  'Liver'),
    ('Rahul Verma',  'Heart'),
    ('Lakshmi Devi', 'Kidney'),
    ('Lakshmi Devi', 'Cornea'),
    ('Anitha Rao',   'Cornea')
);

-- Past blood donations (days_ago). Sneha (30) and Mohammed (60) are
-- inside the 90 day window, so they will NOT be eligible right now.
INSERT INTO blood_donation (donor_id, hospital_id, donation_date, units)
SELECT d.donor_id, h.hospital_id, SYSDATE - v.days_ago, 1
FROM (
    SELECT 'Priya Sharma'    AS dn, 'CMC Vellore'      AS hn, 200 AS days_ago FROM dual UNION ALL
    SELECT 'Karthik Raman',         'Apollo Hospitals',        150            FROM dual UNION ALL
    SELECT 'Sneha Iyer',            'JIPMER',                   30            FROM dual UNION ALL
    SELECT 'Rahul Verma',           'Care Hospitals',          120            FROM dual UNION ALL
    SELECT 'Lakshmi Devi',          'CMC Vellore',              95            FROM dual UNION ALL
    SELECT 'Divya Nair',            'Apollo Hospitals',        400            FROM dual UNION ALL
    SELECT 'Mohammed Faizan',       'Kurnool Government General Hospital', 60 FROM dual UNION ALL
    SELECT 'Anitha Rao',            'Care Hospitals',          100            FROM dual
) v
JOIN donor d    ON d.full_name = v.dn
JOIN hospital h ON h.name      = v.hn;

-- Safety net in case triggers.sql was not run first
UPDATE donor d
SET last_donation_date = (SELECT MAX(b.donation_date)
                          FROM blood_donation b
                          WHERE b.donor_id = d.donor_id)
WHERE last_donation_date IS NULL;

-- Recipients
INSERT INTO recipient (full_name, dob, gender, blood_group, phone, city, hospital_id)
SELECT 'Ravi Teja', DATE '1980-04-02', 'M', 'A+', '9100000001', 'Vellore', hospital_id FROM hospital WHERE name = 'CMC Vellore';
INSERT INTO recipient (full_name, dob, gender, blood_group, phone, city, hospital_id)
SELECT 'Meena Kumari', DATE '1972-10-19', 'F', 'O+', '9100000002', 'Chennai', hospital_id FROM hospital WHERE name = 'Apollo Hospitals';
INSERT INTO recipient (full_name, dob, gender, blood_group, phone, city, hospital_id)
SELECT 'Harish Babu', DATE '2005-03-25', 'M', 'B+', '9100000003', 'Kurnool', hospital_id FROM hospital WHERE name = 'Kurnool Government General Hospital';
INSERT INTO recipient (full_name, dob, gender, blood_group, phone, city, hospital_id)
SELECT 'Fatima Begum', DATE '1968-01-08', 'F', 'AB+', '9100000004', 'Hyderabad', hospital_id FROM hospital WHERE name = 'Care Hospitals';
INSERT INTO recipient (full_name, dob, gender, blood_group, phone, city, hospital_id)
SELECT 'Naveen Kumar', DATE '1990-06-30', 'M', 'O-', '9100000005', 'Puducherry', hospital_id FROM hospital WHERE name = 'JIPMER';
INSERT INTO recipient (full_name, dob, gender, blood_group, phone, city, hospital_id)
SELECT 'Lavanya S', DATE '1985-12-12', 'F', 'A-', '9100000006', 'Chennai', hospital_id FROM hospital WHERE name = 'Apollo Hospitals';

-- Requests (urgency 1 = low, 5 = critical)
INSERT INTO donation_request (recipient_id, request_type, organ_id, units_needed, urgency)
VALUES ((SELECT recipient_id FROM recipient WHERE full_name = 'Ravi Teja'),     'BLOOD', NULL, 2, 4);
INSERT INTO donation_request (recipient_id, request_type, organ_id, units_needed, urgency)
VALUES ((SELECT recipient_id FROM recipient WHERE full_name = 'Meena Kumari'),  'BLOOD', NULL, 1, 2);
INSERT INTO donation_request (recipient_id, request_type, organ_id, units_needed, urgency)
VALUES ((SELECT recipient_id FROM recipient WHERE full_name = 'Naveen Kumar'),  'BLOOD', NULL, 3, 5);
INSERT INTO donation_request (recipient_id, request_type, organ_id, units_needed, urgency)
VALUES ((SELECT recipient_id FROM recipient WHERE full_name = 'Fatima Begum'),  'ORGAN',
        (SELECT organ_id FROM organ_type WHERE organ_name = 'Liver'), NULL, 5);
INSERT INTO donation_request (recipient_id, request_type, organ_id, units_needed, urgency)
VALUES ((SELECT recipient_id FROM recipient WHERE full_name = 'Harish Babu'),   'ORGAN',
        (SELECT organ_id FROM organ_type WHERE organ_name = 'Kidney'), NULL, 3);
INSERT INTO donation_request (recipient_id, request_type, organ_id, units_needed, urgency)
VALUES ((SELECT recipient_id FROM recipient WHERE full_name = 'Lavanya S'),     'BLOOD', NULL, 1, 3);

COMMIT;
