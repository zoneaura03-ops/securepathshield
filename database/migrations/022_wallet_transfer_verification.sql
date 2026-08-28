UPDATE transfers
SET verification_stage='verified'
WHERE transfer_type IN ('paypal','cashapp','skrill')
  AND verification_stage<>'verified';
