package com.example.studentapp

import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.gson.Gson
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class AddStudentActivity : AppCompatActivity() {

    private lateinit var etName: EditText
    private lateinit var etEmail: EditText
    private lateinit var etCourse: EditText
    private lateinit var etSemester: EditText
    private lateinit var btnSubmit: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_add_student)

        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.title = "Add New Student"

        etName = findViewById(R.id.etName)
        etEmail = findViewById(R.id.etEmail)
        etCourse = findViewById(R.id.etCourse)
        etSemester = findViewById(R.id.etSemester)
        btnSubmit = findViewById(R.id.btnSubmit)

        btnSubmit.setOnClickListener {
            submitStudentForm()
        }
    }

    private fun submitStudentForm() {
        val name = etName.text.toString().trim()
        val email = etEmail.text.toString().trim()
        val course = etCourse.text.toString().trim()
        val semesterStr = etSemester.text.toString().trim()

        if (name.isEmpty() || email.isEmpty() || course.isEmpty() || semesterStr.isEmpty()) {
            Toast.makeText(this, "Please fill in all fields", Toast.LENGTH_SHORT).show()
            return
        }

        if (!email.contains("@")) {
            Toast.makeText(this, "Please enter a valid email address", Toast.LENGTH_SHORT).show()
            return
        }

        val semester = semesterStr.toIntOrNull()
        if (semester == null || semester <= 0) {
            Toast.makeText(this, "Semester must be a positive number", Toast.LENGTH_SHORT).show()
            return
        }

        val studentInput = StudentInput(name, email, course, semester)
        btnSubmit.isEnabled = false

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val response = RetrofitClient.apiService.createStudent(studentInput)
                withContext(Dispatchers.Main) {
                    btnSubmit.isEnabled = true
                    if (response.isSuccessful) {
                        Toast.makeText(this@AddStudentActivity, "Student added successfully!", Toast.LENGTH_SHORT).show()
                        finish()
                    } else if (response.code() == 400) {
                        val errorJson = response.errorBody()?.string()
                        val errorMessage = try {
                            val errorResponse = Gson().fromJson(errorJson, ApiErrorResponse::class.java)
                            errorResponse.message ?: "Invalid student data"
                        } catch (e: Exception) {
                            "Invalid student data"
                        }
                        Toast.makeText(this@AddStudentActivity, errorMessage, Toast.LENGTH_LONG).show()
                    } else {
                        Toast.makeText(this@AddStudentActivity, "Something went wrong", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    btnSubmit.isEnabled = true
                    Toast.makeText(this@AddStudentActivity, "Something went wrong", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}
