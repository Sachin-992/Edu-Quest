-- INSPECT DATA
SELECT id, email, role FROM users;

SELECT s.name, s.class_id, c.grade_level, c.section
FROM subjects s
LEFT JOIN classes c ON s.class_id = c.id;

SELECT count(*) as total_teachers FROM teachers;
