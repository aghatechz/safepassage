-- Seed data for SafePassage
-- All user passwords are "password123"
-- Generated via: require('bcryptjs').hash('password123', 10)

INSERT INTO users (name, email, password_hash, role) VALUES
('System Admin', 'admin@safepassage.com', '$2a$10$a/jJChzlFQxuhvLa8wVfY.D/rMaxEpv9PPy.DDfonWjwK7oFrX.jm', 'admin'),
('Ali Khan', 'ali@example.com', '$2a$10$a/jJChzlFQxuhvLa8wVfY.D/rMaxEpv9PPy.DDfonWjwK7oFrX.jm', 'user'),
('Priya Sharma', 'priya@example.com', '$2a$10$a/jJChzlFQxuhvLa8wVfY.D/rMaxEpv9PPy.DDfonWjwK7oFrX.jm', 'user'),
('Rahim Rahman', 'rahim@example.com', '$2a$10$a/jJChzlFQxuhvLa8wVfY.D/rMaxEpv9PPy.DDfonWjwK7oFrX.jm', 'user'),
('Maria Santos', 'maria@example.com', '$2a$10$a/jJChzlFQxuhvLa8wVfY.D/rMaxEpv9PPy.DDfonWjwK7oFrX.jm', 'user');

INSERT INTO agencies (name, location, latitude, longitude, trust_score, is_verified) VALUES
('Gulf Horizon Overseas', 'Mumbai, India', 19.0760, 72.8777, 85, true),
('Apex Global Recruitment', 'Islamabad, Pakistan', 33.6844, 73.0479, 30, false),
('Manila Direct Placements', 'Manila, Philippines', 14.5995, 120.9842, 95, true),
('Bengal Allied Agency', 'Dhaka, Bangladesh', 23.8103, 90.4125, 45, false),
('EuroWork Express Inc.', 'Punjab, Pakistan', 31.5204, 74.3587, 15, false),
('Pacific Maritime Services', 'Cebu, Philippines', 10.3157, 123.8854, 100, false);

INSERT INTO reports (agency_id, user_id, description, evidence_url, red_flags) VALUES
(2, 2, 'They asked me to deposit 50,000 PKR as a visa processing fee before they would send the contract. After I paid, they blocked my phone number.', NULL, ARRAY['pay before visa', 'deposit required']),
(2, 3, 'Offered a guaranteed work visa to Dubai but refused to provide any written contract. Said contract would be signed in Dubai.', NULL, ARRAY['no written contract', 'guaranteed visa']),
(4, 4, 'Charged 10,000 BDT for a mandatory medical checkup and training course at their own facility, but never provided the job offer details.', NULL, ARRAY['training fee', 'deposit required']),
(5, 2, 'They said I will enter Europe on a tourist visa first and then convert it to a work visa, which is illegal. They also asked to keep my original passport.', NULL, ARRAY['tourist visa for work', 'keep original passport']),
(1, 3, 'Very professional service. They charged a standard service fee only after my work visa was processed and verified. Highly recommend.', NULL, '{}');

INSERT INTO votes (report_id, user_id, vote_type) VALUES
(1, 3, 'upvote'),
(1, 4, 'upvote'),
(2, 2, 'upvote'),
(3, 2, 'upvote'),
(4, 4, 'upvote'),
(5, 4, 'downvote'); -- downvote on the positive report is unlikely but this tests voting functionality
