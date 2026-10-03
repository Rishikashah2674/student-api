package com.example.studentapp

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface StudentApiService {

    @GET("students")
    suspend fun getStudents(): Response<List<Student>>

    @GET("students/{id}")
    suspend fun getStudentById(@Path("id") id: String): Response<Student>

    @POST("students")
    suspend fun createStudent(@Body studentInput: StudentInput): Response<Student>
}
