<?php

namespace Database\Seeders;

use App\Models\SkillTags;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SkillTagSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tags = [
            // General Skills
            ['tag_title' => 'Critical Thinking', 'description' => 'Analyzing facts to form a judgment.'],
            ['tag_title' => 'Problem Solving', 'description' => 'Identifying and resolving challenges effectively.'],
            ['tag_title' => 'Communication', 'description' => 'Verbal and written interaction skills.'],
            ['tag_title' => 'Teamwork', 'description' => 'Collaborating effectively in group settings.'],
            ['tag_title' => 'Leadership', 'description' => 'Inspiring and guiding individuals or teams.'],
            ['tag_title' => 'Time Management', 'description' => 'Prioritizing and organizing tasks efficiently.'],
            ['tag_title' => 'Adaptability', 'description' => 'Adjusting effectively to change and challenges.'],
            ['tag_title' => 'Creativity', 'description' => 'Generating innovative ideas and solutions.'],
            ['tag_title' => 'Negotiation', 'description' => 'Reaching mutually beneficial agreements.'],
            ['tag_title' => 'Project Management', 'description' => 'Planning and executing projects successfully.'],
            ['tag_title' => 'Customer Service', 'description' => 'Handling client interactions and concerns professionally.'],
            ['tag_title' => 'Public Speaking', 'description' => 'Presenting ideas clearly in front of an audience.'],
            ['tag_title' => 'Emotional Intelligence', 'description' => 'Recognizing and managing emotions in self and others.'],
            ['tag_title' => 'Conflict Resolution', 'description' => 'Mediating disputes and finding solutions.'],

            // Business & Finance
            ['tag_title' => 'Entrepreneurship', 'description' => 'Launching and managing a business.'],
            ['tag_title' => 'Marketing 101', 'description' => 'Understanding promotion and brand strategy.'],
            ['tag_title' => 'Sales Techniques', 'description' => 'Driving customer engagement and conversions.'],
            ['tag_title' => 'Accounting Basics', 'description' => 'Managing financial records and reports.'],
            ['tag_title' => 'Financial Literacy', 'description' => 'Understanding budgets, savings, and investments.'],
            ['tag_title' => 'Business Analytics', 'description' => 'Analyzing business data for insights.'],
            ['tag_title' => 'Supply Chain Management', 'description' => 'Coordinating production and distribution.'],
            ['tag_title' => 'Human Resource Management', 'description' => 'Recruitment, training, and compliance.'],

            // IT & Tech
            ['tag_title' => 'HTML Basics', 'description' => 'Structuring content for the web.'],
            ['tag_title' => 'CSS Styling', 'description' => 'Designing and styling web pages.'],
            ['tag_title' => 'JavaScript', 'description' => 'Programming dynamic web features.'],
            ['tag_title' => 'React.js', 'description' => 'Building user interfaces with components.'],
            ['tag_title' => 'Laravel', 'description' => 'PHP web framework for backend development.'],
            ['tag_title' => 'APIs', 'description' => 'Integrating and communicating between systems.'],
            ['tag_title' => 'Git Basics', 'description' => 'Version control and collaboration.'],
            ['tag_title' => 'Cybersecurity', 'description' => 'Protecting systems from digital threats.'],
            ['tag_title' => 'Data Analysis', 'description' => 'Interpreting data for insights.'],
            ['tag_title' => 'Cloud Computing', 'description' => 'Delivering computing services over the internet.'],
            ['tag_title' => 'DevOps', 'description' => 'CI/CD and operations automation.'],
            ['tag_title' => 'NoSQL', 'description' => 'Handling data in non-relational databases.'],
            ['tag_title' => 'Graph Databases', 'description' => 'Modeling relationships using nodes and edges.'],

            // Healthcare
            ['tag_title' => 'First Aid', 'description' => 'Basic emergency medical procedures.'],
            ['tag_title' => 'Medical Terminology', 'description' => 'Common terms used in healthcare.'],
            ['tag_title' => 'Patient Care', 'description' => 'Assisting with basic health needs.'],
            ['tag_title' => 'Anatomy Basics', 'description' => 'Understanding the human body structure.'],
            ['tag_title' => 'Mental Health Awareness', 'description' => 'Understanding emotional and psychological well-being.'],

            // Education & Training
            ['tag_title' => 'Instructional Design', 'description' => 'Creating effective learning materials.'],
            ['tag_title' => 'Classroom Management', 'description' => 'Maintaining order and productivity in learning environments.'],
            ['tag_title' => 'Curriculum Development', 'description' => 'Designing structured learning content.'],

            // Law & Government
            ['tag_title' => 'Legal Research', 'description' => 'Finding and analyzing laws and regulations.'],
            ['tag_title' => 'Civic Literacy', 'description' => 'Understanding government and citizen roles.'],
            ['tag_title' => 'Public Administration', 'description' => 'Managing public services and institutions.'],

            // Design & Arts
            ['tag_title' => 'Graphic Design', 'description' => 'Creating visual content with design tools.'],
            ['tag_title' => 'UX/UI Design', 'description' => 'Designing intuitive and appealing interfaces.'],
            ['tag_title' => 'Photography Basics', 'description' => 'Capturing quality photos with composition in mind.'],
            ['tag_title' => 'Video Editing', 'description' => 'Cutting and arranging visual content.'],

            // Hospitality & Tourism
            ['tag_title' => 'Event Planning', 'description' => 'Coordinating and organizing events.'],
            ['tag_title' => 'Food Safety', 'description' => 'Hygiene and storage practices for food.'],
            ['tag_title' => 'Travel Coordination', 'description' => 'Organizing travel plans and bookings.'],

            // Engineering & Manufacturing
            ['tag_title' => 'Mechanical Drawing', 'description' => 'Technical blueprints and schematics.'],
            ['tag_title' => 'CAD Basics', 'description' => 'Using computer-aided design software.'],
            ['tag_title' => 'Lean Manufacturing', 'description' => 'Optimizing production processes.'],

            // Media & Communication
            ['tag_title' => 'Journalism', 'description' => 'Investigating and reporting news.'],
            ['tag_title' => 'Content Writing', 'description' => 'Creating compelling written content.'],
            ['tag_title' => 'Social Media Strategy', 'description' => 'Managing platforms and engagement.'],

            // Agriculture & Environment
            ['tag_title' => 'Sustainable Farming', 'description' => 'Eco-friendly agricultural methods.'],
            ['tag_title' => 'Soil Management', 'description' => 'Techniques to maintain fertile land.'],
            ['tag_title' => 'Climate Change Awareness', 'description' => 'Understanding global environmental issues.'],

            // Logistics & Transportation
            ['tag_title' => 'Inventory Management', 'description' => 'Tracking and storing goods efficiently.'],
            ['tag_title' => 'Fleet Operations', 'description' => 'Managing vehicle usage and maintenance.'],
            ['tag_title' => 'Warehouse Safety', 'description' => 'Ensuring safety in storage facilities.'],
        ];

        DB::table('skill_tags')->insert($tags);
    }
}
