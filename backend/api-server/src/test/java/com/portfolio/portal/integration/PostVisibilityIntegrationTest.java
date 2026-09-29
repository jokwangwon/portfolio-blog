package com.portfolio.portal.integration;
import com.fasterxml.jackson.databind.*;
import com.portfolio.domain.blog.*;
import com.portfolio.domain.blog.repository.*;
import com.portfolio.domain.user.*;
import com.portfolio.domain.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import java.util.*;
import com.portfolio.security.jwt.JwtTokenProvider;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
class PostVisibilityIntegrationTest extends IntegrationTestBase {
 @Autowired JwtTokenProvider jwt;
 String token(String name){return "Bearer "+jwt.generateAccessToken(new UsernamePasswordAuthenticationToken(name,null,List.of(new SimpleGrantedAuthority(name.equals("owner")?"ROLE_ADMIN":"ROLE_USER"))));}
 @Autowired PostRepository postVersions;
 @Autowired ObjectMapper mapper; @Autowired UserRepository users;
 @Autowired CategoryRepository categories; @Autowired TagRepository tags;
 Long categoryId; Long tagId;
 @BeforeEach void fixtures(){
  users.save(User.builder().username("owner").email("owner@example.com").password("unused").role(UserRole.ADMIN).build());
  users.save(User.builder().username("other").email("other@example.com").password("unused").role(UserRole.USER).build());
  categoryId=categories.save(Category.builder().name("Visibility category").slug("visibility-category").build()).getId();
  tagId=tags.save(Tag.builder().name("Visibility tag").slug("visibility-tag").build()).getId();
 }
 Map<String,Object> body(String title,String state,String visibility){
  Map<String,Object> b=new HashMap<>(Map.of("title",title,"content","needle content","status",state,"categoryId",categoryId,"tagIds",List.of(tagId)));
  if(visibility!=null)b.put("visibility",visibility);return b;
 }
 Map<String,Object> versioned(long id,Map<String,Object> body){body.put("expectedEditVersion",postVersions.findById(id).orElseThrow().getEditVersion());return body;}
 JsonNode create(String title,String state,String visibility)throws Exception{
  return mapper.readTree(mockMvc.perform(post("/api/portal/posts").header("Authorization",token("owner")).contentType(MediaType.APPLICATION_JSON)
   .content(mapper.writeValueAsString(body(title,state,visibility)))).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
 }
 @Test void privateCompletedPostIsOwnerOnlyAndHiddenFromPublicQueries()throws Exception{
  create("Public needle","PUBLISHED",null);long id=create("Private needle","PUBLISHED","PRIVATE").get("id").asLong();create("Draft needle","DRAFT","PUBLIC");
  mockMvc.perform(get("/api/portal/posts/"+id)).andExpect(status().isNotFound());
  mockMvc.perform(get("/api/portal/posts/"+id).header("Authorization",token("other"))).andExpect(status().isNotFound());
  mockMvc.perform(get("/api/portal/posts/"+id).header("Authorization",token("owner"))).andExpect(status().isOk())
   .andExpect(header().string("Cache-Control", "no-store")).andExpect(jsonPath("$.visibility").value("PRIVATE")).andExpect(jsonPath("$.status").value("PUBLISHED")).andExpect(jsonPath("$.viewCount").value(0));
  for(String url:List.of("/api/portal/posts","/api/portal/posts?categoryId="+categoryId,"/api/portal/posts?tag=visibility-tag","/api/portal/posts/search?keyword=needle")){
   mockMvc.perform(get(url)).andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1)).andExpect(jsonPath("$.content[0].title").value("Public needle"));
  }
  mockMvc.perform(get("/api/portal/posts/"+id+"/comments")).andExpect(status().isNotFound());
  mockMvc.perform(post("/api/portal/posts/"+id+"/like").header("Authorization",token("other"))).andExpect(status().isNotFound());
  mockMvc.perform(get("/api/portal/posts/my?visibility=PRIVATE&status=PUBLISHED").header("Authorization",token("owner")))
   .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
 }
 @Test void privateTransitionHidesCommentsAndOmittedFieldPreservesPrivacy()throws Exception{
  long id=create("Public before","PUBLISHED","PUBLIC").get("id").asLong();
  mockMvc.perform(post("/api/portal/posts/"+id+"/comments").header("Authorization",token("other")).contentType(MediaType.APPLICATION_JSON)
   .content("{\"content\":\"Existing discussion\"}")).andExpect(status().isCreated());
  for(String visibility:new String[]{"PRIVATE",null})mockMvc.perform(put("/api/portal/posts/"+id).header("Authorization",token("owner"))
   .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(versioned(id,body("Now private","PUBLISHED",visibility)))))
   .andExpect(status().isOk()).andExpect(jsonPath("$.visibility").value("PRIVATE"));
  mockMvc.perform(get("/api/portal/posts/"+id)).andExpect(status().isNotFound());
  mockMvc.perform(get("/api/portal/posts/"+id+"/comments")).andExpect(status().isNotFound());
  mockMvc.perform(get("/api/portal/posts")).andExpect(jsonPath("$.totalElements").value(0));
 }
 @Test void invalidVisibilityIsRejected()throws Exception{
  mockMvc.perform(get("/api/portal/posts/my?visibility=SECRET").header("Authorization",token("owner"))).andExpect(status().isBadRequest());
  long id=create("Private","PUBLISHED","PRIVATE").get("id").asLong();
  mockMvc.perform(put("/api/portal/posts/"+id).header("Authorization",token("owner")).contentType(MediaType.APPLICATION_JSON)
   .content(mapper.writeValueAsString(body("Bad update","PUBLISHED","SECRET")))).andExpect(status().isBadRequest());
  mockMvc.perform(get("/api/portal/posts/"+id)).andExpect(status().isNotFound());
 }
}
