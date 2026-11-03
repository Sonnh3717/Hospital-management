UPDATE `user_accounts` 
SET `password_hash` = '$2a$10$1ESQsz5IwHnsHmOb8MEVgudoDo9GhDAeyTALlYjChTvPUiQAS6btu'
WHERE `username` IN ('admin', 'manager', 'receptionist', 'doctor', 'servicestaff', 'patient', 'patient02', 'Nam');

