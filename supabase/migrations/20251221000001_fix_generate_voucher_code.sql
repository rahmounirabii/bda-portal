-- Fix generate_voucher_code function to work with exam_vouchers table
-- This restores the original function that was overwritten by the ECP migration

DROP FUNCTION IF EXISTS generate_voucher_code(certification_type);

-- Function to generate voucher code for exam_vouchers
CREATE OR REPLACE FUNCTION generate_voucher_code(cert_type certification_type)
RETURNS TEXT AS $$
DECLARE
    prefix TEXT;
    random_suffix TEXT;
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    -- Set prefix based on certification type
    prefix := CASE
        WHEN cert_type = 'CP' THEN 'CERT-CP-'
        WHEN cert_type = 'SCP' THEN 'CERT-SCP-'
        ELSE 'CERT-'
    END;

    -- Generate unique code
    LOOP
        -- Generate random 8-character alphanumeric suffix
        random_suffix := upper(substring(md5(random()::text) from 1 for 8));
        new_code := prefix || random_suffix;

        -- Check if code already exists in exam_vouchers
        SELECT EXISTS(SELECT 1 FROM public.exam_vouchers WHERE code = new_code) INTO code_exists;

        -- Exit loop if code is unique
        EXIT WHEN NOT code_exists;
    END LOOP;

    RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION generate_voucher_code(certification_type) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_voucher_code(certification_type) TO anon;

COMMENT ON FUNCTION generate_voucher_code IS 'Generates a unique voucher code for exam_vouchers based on certification type';
