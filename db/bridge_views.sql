-- ====================================================================
-- bridge_views.sql : Bridges full DBMS project schema (tables.sql)
-- with the Next.js Web App API routes.
-- Run this script in SQL Developer AFTER running:
--   1. tables.sql
--   2. triggers.sql
--   3. procedures.sql
--   4. sample_data.sql
-- ====================================================================

-- 1. Function to check compatibility for web cursor queries
CREATE OR REPLACE FUNCTION is_compatible_web(p_donor VARCHAR2, p_recip VARCHAR2) 
RETURN NUMBER IS
  d_abo VARCHAR2(2);
  r_abo VARCHAR2(2);
  d_rh  CHAR(1);
  r_rh  CHAR(1);
BEGIN
  d_abo := SUBSTR(p_donor, 1, LENGTH(p_donor) - 1);
  d_rh  := SUBSTR(p_donor, -1);
  r_abo := SUBSTR(p_recip, 1, LENGTH(p_recip) - 1);
  r_rh  := SUBSTR(p_recip, -1);
  IF d_rh = '+' AND r_rh = '-' THEN RETURN 0; END IF;
  IF d_abo = 'O' THEN RETURN 1; END IF;
  IF d_abo = r_abo THEN RETURN 1; END IF;
  IF r_abo = 'AB' THEN RETURN 1; END IF;
  RETURN 0;
END;
/

-- 2. Procedure find_matches matching the web app parameters
CREATE OR REPLACE PROCEDURE find_matches(p_recipient_id IN NUMBER, p_result OUT SYS_REFCURSOR) IS
  r_group recipient.blood_group%TYPE;
  r_type  VARCHAR2(10);
  r_organ VARCHAR2(30);
BEGIN
  -- Look up request details from donation_request
  SELECT r.blood_group, LOWER(req.request_type), LOWER(NVL(ot.organ_name, ''))
  INTO r_group, r_type, r_organ
  FROM recipient r
  JOIN donation_request req ON req.recipient_id = r.recipient_id
  LEFT JOIN organ_type ot ON ot.organ_id = req.organ_id
  WHERE r.recipient_id = p_recipient_id AND ROWNUM = 1;

  IF r_type = 'blood' THEN
    OPEN p_result FOR
      SELECT d.donor_id, d.full_name, d.blood_group, d.city, d.phone
      FROM donor d
      WHERE d.is_available = 'Y' 
        AND is_eligible_blood_donor(d.donor_id) = 'Y'
        AND is_compatible_web(d.blood_group, r_group) = 1;
  ELSE
    OPEN p_result FOR
      SELECT d.donor_id, d.full_name, d.blood_group, d.city, d.phone
      FROM donor d
      JOIN donor_organ do ON do.donor_id = d.donor_id
      JOIN organ_type ot ON ot.organ_id = do.organ_id
      WHERE d.is_available = 'Y' 
        AND do.status = 'PLEDGED'
        AND LOWER(ot.organ_name) = r_organ
        AND is_compatible_web(d.blood_group, r_group) = 1;
  END IF;
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    OPEN p_result FOR SELECT 1 FROM dual WHERE 1 = 0;
END;
/

-- 3. Procedure confirm_match for web app
CREATE OR REPLACE PROCEDURE confirm_match(p_donor_id IN NUMBER, p_recipient_id IN NUMBER) IS
  v_req_id NUMBER;
BEGIN
  SELECT request_id INTO v_req_id
  FROM donation_request
  WHERE recipient_id = p_recipient_id AND status = 'OPEN' AND ROWNUM = 1;

  INSERT INTO donation_match (request_id, donor_id, status)
  VALUES (v_req_id, p_donor_id, 'COMPLETED');
  
  UPDATE donor SET is_available = 'N' WHERE donor_id = p_donor_id;
  COMMIT;
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    -- Fallback if no open request was found
    UPDATE donor SET is_available = 'N' WHERE donor_id = p_donor_id;
    COMMIT;
END;
/

