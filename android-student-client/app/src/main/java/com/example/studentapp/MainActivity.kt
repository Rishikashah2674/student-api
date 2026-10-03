package com.example.studentapp

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.floatingactionbutton.FloatingActionButton
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : AppCompatActivity() {

    private lateinit var recyclerView: RecyclerView
    private lateinit var progressBar: ProgressBar
    private lateinit var tvEmptyState: TextView
    private lateinit var fabAddStudent: FloatingActionButton
    private lateinit var adapter: StudentAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        recyclerView = findViewById(R.id.recyclerView)
        progressBar = findViewById(R.id.progressBar)
        tvEmptyState = findViewById(R.id.tvEmptyState)
        fabAddStudent = findViewById(R.id.fabAddStudent)

        adapter = StudentAdapter(emptyList())
        recyclerView.layoutManager = LinearLayoutManager(this)
        recyclerView.adapter = adapter

        fabAddStudent.setOnClickListener {
            val intent = Intent(this, AddStudentActivity::class.java)
            startActivity(intent)
        }

        fetchStudents()
    }

    override fun onResume() {
        super.onResume()
        fetchStudents()
    }

    private fun fetchStudents() {
        progressBar.visibility = View.VISIBLE
        tvEmptyState.visibility = View.GONE

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val response = RetrofitClient.apiService.getStudents()
                withContext(Dispatchers.Main) {
                    progressBar.visibility = View.GONE
                    if (response.isSuccessful) {
                        val students = response.body() ?: emptyList()
                        if (students.isEmpty()) {
                            tvEmptyState.text = "No students found."
                            tvEmptyState.visibility = View.VISIBLE
                        } else {
                            adapter.updateData(students)
                        }
                    } else if (response.code() == 404) {
                        Toast.makeText(this@MainActivity, "Student not found", Toast.LENGTH_SHORT).show()
                    } else {
                        Toast.makeText(this@MainActivity, "Something went wrong", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    progressBar.visibility = View.GONE
                    tvEmptyState.text = "Failed to connect to server."
                    tvEmptyState.visibility = View.VISIBLE
                    Toast.makeText(this@MainActivity, "Something went wrong", Toast.LENGTH_LONG).show()
                }
            }
        }
    }
}
