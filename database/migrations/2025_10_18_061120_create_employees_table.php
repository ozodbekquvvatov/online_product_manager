    <?php

    use Illuminate\Database\Migrations\Migration;
    use Illuminate\Database\Schema\Blueprint;
    use Illuminate\Support\Facades\Schema;

    return new class extends Migration
    {
        /**
         * Run the migrations.
         */
        public function up(): void
        {
            Schema::create('employees', function (Blueprint $table) {
                $table->id();
                $table->string('employee_id')->unique();
                $table->string('first_name');
                $table->string('last_name');
                $table->string('position');
                $table->string('department');
                $table->decimal('base_salary', 10, 2)->default(0); // Changed from salary to base_salary
                $table->date('hire_date');
                $table->date('date_of_birth')->nullable();
                $table->text('address')->nullable();
                $table->enum('employment_type', ['full_time', 'part_time', 'contract', 'temporary'])->default('full_time');
                $table->integer('work_hours_per_day')->default(8); // New field
                $table->enum('work_shift', ['day', 'night', 'both'])->default('day'); // New field
                $table->boolean('is_active')->default(true); // New field (replaces status)
                $table->timestamps();

                // Indexes for better performance
                $table->index('employee_id');
                $table->index('position');
                $table->index('department');
                $table->index('is_active'); // Changed from status to is_active
                $table->index('hire_date');
            });
        }

        /**
         * Reverse the migrations.
         */
        public function down(): void
        {
            Schema::dropIfExists('employees');
        }
    };
