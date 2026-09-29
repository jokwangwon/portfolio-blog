package com.portfolio.portal.integration;
import com.fasterxml.jackson.databind.*;
import com.portfolio.domain.user.*;
import com.portfolio.domain.user.repository.UserRepository;
import com.portfolio.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MvcResult;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
class PostEditVersionIntegrationTest extends IntegrationTestBase {
 @Autowired ObjectMapper json; @Autowired UserRepository users; @Autowired JwtTokenProvider jwt;
 String token(String name){return "Bearer "+jwt.generateAccessToken(new UsernamePasswordAuthenticationToken(name,null,List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));}
 @BeforeEach void fixtures(){for(String name:List.of("editor","outsider"))users.save(User.builder().username(name).email(name+"@example.com").password("unused").role(UserRole.ADMIN).build());}
 Map<String,Object> body(String content,Long version){var m=new HashMap<String,Object>(Map.of("title","Version study","content",content,"excerpt","study","status","PUBLISHED","visibility","PUBLIC","tagIds",List.of()));if(version!=null)m.put("expectedEditVersion",version);return m;}
 JsonNode read(MvcResult r)throws Exception{return json.readTree(r.getResponse().getContentAsString());}
 JsonNode create()throws Exception{var r=mockMvc.perform(post("/api/portal/posts").header("Authorization",token("editor")).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body("original",null)))).andReturn();assertEquals(201,r.getResponse().getStatus());return read(r);}
 MvcResult save(long id,Map<String,Object> data,String name)throws Exception{return mockMvc.perform(put("/api/portal/posts/"+id).header("Authorization",token(name)).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(data))).andReturn();}
 JsonNode getPost(long id)throws Exception{return read(mockMvc.perform(get("/api/portal/posts/"+id).header("Authorization",token("editor"))).andReturn());}
 @Test void staleAndMissingDoNotOverwrite()throws Exception{
  var p=create();long id=p.get("id").asLong();assertEquals(0,p.path("editVersion").asLong(-1));
  var saved=save(id,body("first saved",0L),"editor");assertEquals(200,saved.getResponse().getStatus());assertEquals(1,read(saved).path("editVersion").asLong());
  var stale=save(id,body("stale tab",0L),"editor");assertEquals(409,stale.getResponse().getStatus());assertEquals("POST_EDIT_CONFLICT",read(stale).path("code").asText());
  var missing=save(id,body("old client",null),"editor");assertEquals(400,missing.getResponse().getStatus());assertEquals("POST_EDIT_VERSION_REQUIRED",read(missing).path("code").asText());assertEquals("first saved",getPost(id).get("content").asText());
 }
 @Test void noOpAndCountersPreserveEditMetadata()throws Exception{
  long id=create().get("id").asLong();var first=getPost(id);var second=getPost(id);assertEquals(first.get("updatedAt"),second.get("updatedAt"));assertEquals(first.get("editedAt"),second.get("editedAt"));assertEquals(0,second.path("editVersion").asLong(-1));
  var same=save(id,body("original",0L),"editor");assertEquals(200,same.getResponse().getStatus());assertEquals(0,read(same).path("editVersion").asLong(-1));assertEquals(first.get("editedAt"),read(same).get("editedAt"));
  assertEquals(200,mockMvc.perform(post("/api/portal/posts/"+id+"/like").header("Authorization",token("editor"))).andReturn().getResponse().getStatus());var after=getPost(id);assertEquals(first.get("updatedAt"),after.get("updatedAt"));assertEquals(first.get("editedAt"),after.get("editedAt"));
 }
 @Test void concurrentSavesHaveOneWinner()throws Exception{
  long id=create().get("id").asLong();var start=new CountDownLatch(1);
  var pool=Executors.newFixedThreadPool(2);try{
   var a=pool.submit(()->{start.await();return save(id,body("writer A",0L),"editor").getResponse().getStatus();});var b=pool.submit(()->{start.await();return save(id,body("writer B",0L),"editor").getResponse().getStatus();});start.countDown();var results=new ArrayList<>(List.of(a.get(20,TimeUnit.SECONDS),b.get(20,TimeUnit.SECONDS)));Collections.sort(results);assertEquals(List.of(200,409),results);
  }finally{pool.shutdownNow();}assertEquals(1,getPost(id).path("editVersion").asLong());
 }
 @Test void visibilityVersionAndPermissionPrecedence()throws Exception{
  long id=create().get("id").asLong();var data=body("original",0L);data.put("visibility","PRIVATE");assertEquals(200,save(id,data,"editor").getResponse().getStatus());assertEquals(403,save(id,body("intruder",null),"outsider").getResponse().getStatus());assertEquals(409,save(id,body("stale public",0L),"editor").getResponse().getStatus());assertEquals("PRIVATE",getPost(id).path("visibility").asText());
 }
 @Test void ownerListExcludesBody()throws Exception{
  create();var list=read(mockMvc.perform(get("/api/portal/posts/my").header("Authorization",token("editor"))).andReturn());var content=list.path("content").get(0).path("content");assertTrue(content.isNull()||content.isMissingNode());
 }
}
